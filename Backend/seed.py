import random
from datetime import datetime, timedelta
from pymongo import MongoClient

# 1. Connect to the database
client = MongoClient("mongodb+srv://Manvendra:Manvendra12345678@cluster0.18twbe4.mongodb.net/?appName=Cluster0")
db = client.instant_mechanic_db

def generate_seed_data():
    print("Clearing old data...")
    db.bookings.drop() 
    
    # Required realistic data parameters
    statuses = ["Pending", "Assigned", "Mechanic On The Way", "Completed", "Cancelled"]
    services = ["Oil Change", "Brake Inspection", "Engine Diagnostics", "Tire Rotation", "Battery Replacement"]
    
    # Generate 20+ mechanics and 50+ customers
    mechanics = [{"mechanic_id": f"M{i}", "name": f"Mechanic {i}"} for i in range(1, 25)]
    customers = [{"customer_id": f"C{i}", "name": f"Customer {i}"} for i in range(1, 60)]
    
    bookings = []
    print("Generating 500+ realistic bookings...")
    
    # Generate 550 bookings to safely exceed the requirement
    for i in range(550):
        status = random.choice(statuses)
        
        # If a booking is 'Pending', a mechanic shouldn't be assigned yet
        assigned_mechanic = random.choice(mechanics) if status != "Pending" else None
        
        booking = {
            "booking_id": f"BKN-{1000+i}",
            "customer": random.choice(customers),
            "mechanic": assigned_mechanic,
            "service": random.choice(services),
            "status": status,
            "amount": round(random.uniform(50.0, 500.0), 2),
            "date": (datetime.now() - timedelta(days=random.randint(0, 30))).isoformat()
        }
        bookings.append(booking)
        
    # Insert all generated data into MongoDB
    db.bookings.insert_many(bookings)
    print(f"Successfully seeded {len(bookings)} bookings into the database!")

if __name__ == "__main__":
    generate_seed_data()