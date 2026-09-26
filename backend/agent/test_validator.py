from backend.agent.graph.nodes.validator import (
    estimate_rows_affected,
    validate_sql_safety,
)


test_sql = """
DELETE FROM orders;
"""

print("SQL:")
print(test_sql)

print("Risk flags:")
print(validate_sql_safety(test_sql))

print("Estimated rows affected:")
print(estimate_rows_affected(test_sql))