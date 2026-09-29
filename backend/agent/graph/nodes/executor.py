import sqlparse

from backend.agent.graph.state import AgentState
from backend.database.connection import get_connection
from backend.agent.graph.nodes.validator import validate_sql_safety


def execute_sql(state: AgentState) -> dict:
    """
    Execute approved SQL against the SQLite sandbox database.
    """

    sql = state.get("generated_sql")

    if state.get("human_decision") != "approved":
        return {
            "execution_result": {
                "success": False,
                "error": "Explicit approval is required before execution.",
            },
            "workflow_status": "blocked",
        }

    if state.get("risk_flags"):
        return {
            "execution_result": {
                "success": False,
                "error": "SQL with validation risks cannot be executed.",
            },
            "workflow_status": "blocked",
        }

    if not sql or state.get("validated_sql") != sql:
        return {
            "execution_result": {
                "success": False,
                "error": "SQL must pass validation before execution.",
            },
            "workflow_status": "blocked",
        }

    if validate_sql_safety(sql, state.get("intent")):
        return {
            "execution_result": {
                "success": False,
                "error": "SQL failed the execution safety check.",
            },
            "workflow_status": "blocked",
        }

    connection = get_connection()

    try:
        cursor = connection.execute(sql)

        statement_type = sqlparse.parse(sql)[0].get_type()
        if statement_type == "SELECT":
            rows = [dict(row) for row in cursor.fetchall()]

            return {
                "execution_result": {
                    "success": True,
                    "type": "read",
                    "rows": rows,
                    "row_count": len(rows),
                },
                "workflow_status": "completed",
            }

        returned_rows = [dict(row) for row in cursor.fetchall()] if cursor.description else []
        connection.commit()

        return {
            "execution_result": {
                "success": True,
                "type": "write",
                "rows_affected": cursor.rowcount,
                    "rows": returned_rows,
                },
                "workflow_status": "completed",
        }

    except Exception as error:
        connection.rollback()

        return {
            "execution_result": {
                "success": False,
                    "error": f"SQLite execution failed: {error}",
                },
                "workflow_status": "execution_failed",
        }

    finally:
        connection.close()