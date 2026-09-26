from backend.database.connection import get_connection


def get_database_schema() -> str:
    connection = get_connection()

    try:
        tables = connection.execute(
            """
            SELECT name
            FROM sqlite_master
            WHERE type = 'table'
            AND name NOT LIKE 'sqlite_%'
            ORDER BY name;
            """
        ).fetchall()

        schema_parts = []

        for table in tables:
            table_name = table["name"]

            columns = connection.execute(
                f"PRAGMA table_info({table_name})"
            ).fetchall()

            schema_parts.append(f"Table: {table_name}")

            for column in columns:
                schema_parts.append(
                    f"  - {column['name']} ({column['type']})"
                )

            schema_parts.append("")

        return "\n".join(schema_parts)

    finally:
        connection.close()

if __name__ == "__main__":
    print(get_database_schema())