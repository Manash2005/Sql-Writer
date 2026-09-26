from datetime import datetime, timedelta

from backend.database.connection import get_connection


def create_tables(connection):
    connection.executescript(
        """
        DROP TABLE IF EXISTS orders;
        DROP TABLE IF EXISTS products;
        DROP TABLE IF EXISTS customers;

        CREATE TABLE customers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT NOT NULL UNIQUE,
            city TEXT NOT NULL,
            created_at TEXT NOT NULL
        );

        CREATE TABLE products (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            category TEXT NOT NULL,
            price REAL NOT NULL,
            stock INTEGER NOT NULL,
            created_at TEXT NOT NULL
        );

        CREATE TABLE orders (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            customer_id INTEGER NOT NULL,
            product_id INTEGER NOT NULL,
            quantity INTEGER NOT NULL,
            total_amount REAL NOT NULL,
            status TEXT NOT NULL,
            created_at TEXT NOT NULL,

            FOREIGN KEY (customer_id)
                REFERENCES customers(id),

            FOREIGN KEY (product_id)
                REFERENCES products(id)
        );
        """
    )


def seed_customers(connection):
    customers = [
        ("Rahul Sharma", "rahul@example.com", "Bengaluru"),
        ("Priya Das", "priya@example.com", "Bhubaneswar"),
        ("Arjun Mehta", "arjun@example.com", "Mumbai"),
        ("Sneha Patel", "sneha@example.com", "Pune"),
        ("Rohan Singh", "rohan@example.com", "Delhi"),
    ]

    connection.executemany(
        """
        INSERT INTO customers (
            name,
            email,
            city,
            created_at
        )
        VALUES (?, ?, ?, ?)
        """,
        [
            (
                name,
                email,
                city,
                (datetime.now() - timedelta(days=index * 30)).isoformat(),
            )
            for index, (name, email, city) in enumerate(customers)
        ],
    )


def seed_products(connection):
    products = [
        ("Laptop", "Electronics", 75000.00, 15),
        ("Wireless Mouse", "Electronics", 1200.00, 50),
        ("Keyboard", "Electronics", 2500.00, 30),
        ("Office Chair", "Furniture", 12000.00, 10),
        ("Desk Lamp", "Furniture", 1800.00, 25),
        ("Notebook", "Stationery", 250.00, 100),
    ]

    connection.executemany(
        """
        INSERT INTO products (
            name,
            category,
            price,
            stock,
            created_at
        )
        VALUES (?, ?, ?, ?, ?)
        """,
        [
            (
                name,
                category,
                price,
                stock,
                datetime.now().isoformat(),
            )
            for name, category, price, stock in products
        ],
    )


def seed_orders(connection):
    now = datetime.now()

    orders = [
        (1, 1, 1, 75000.00, "pending", now - timedelta(days=2)),
        (2, 2, 2, 2400.00, "shipped", now - timedelta(days=3)),
        (3, 3, 3, 2500.00, "delivered", now - timedelta(days=5)),
        (4, 4, 4, 12000.00, "cancelled", now - timedelta(days=15)),
        (5, 5, 5, 1800.00, "pending", now - timedelta(days=20)),
        (1, 6, 6, 500.00, "delivered", now - timedelta(days=45)),
        (2, 1, 1, 75000.00, "cancelled", now - timedelta(days=100)),
        (3, 2, 2, 2400.00, "pending", now - timedelta(days=120)),
        (4, 3, 1, 2500.00, "delivered", now - timedelta(days=200)),
        (5, 4, 1, 12000.00, "cancelled", now - timedelta(days=400)),
    ]

    connection.executemany(
        """
        INSERT INTO orders (
            customer_id,
            product_id,
            quantity,
            total_amount,
            status,
            created_at
        )
        VALUES (?, ?, ?, ?, ?, ?)
        """,
        [
            (
                customer_id,
                product_id,
                quantity,
                total_amount,
                status,
                created_at.isoformat(),
            )
            for (
                customer_id,
                product_id,
                quantity,
                total_amount,
                status,
                created_at,
            ) in orders
        ],
    )


def seed_database():
    connection = get_connection()

    try:
        create_tables(connection)
        seed_customers(connection)
        seed_products(connection)
        seed_orders(connection)

        connection.commit()

        print("Database seeded successfully.")

    except Exception:
        connection.rollback()
        raise

    finally:
        connection.close()


if __name__ == "__main__":
    seed_database()