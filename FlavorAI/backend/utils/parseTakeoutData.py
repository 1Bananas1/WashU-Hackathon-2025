import json
import requests
import time
import importlib.util
import sys
import os
from collections import defaultdict

# Load API key
api_key_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "../..", "APIkey.py"))
spec = importlib.util.spec_from_file_location("APIkey", api_key_path)
api_key_module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(api_key_module)

API_KEY = api_key_module.otherAPI_key

# Dictionary mapping restaurant types to cuisines
CUISINE_MAPPING = {
    "mexican_restaurant": "Mexican",
    "italian_restaurant": "Italian",
    "chinese_restaurant": "Chinese",
    "thai_restaurant": "Thai",
    "japanese_restaurant": "Japanese",
    "indian_restaurant": "Indian",
    "french_restaurant": "French",
    "greek_restaurant": "Greek",
    "korean_restaurant": "Korean",
    "vietnamese_restaurant": "Vietnamese",
    "mediterranean_restaurant": "Mediterranean",
    "american_restaurant": "American",
    "bbq": "BBQ",
    "burger_restaurant": "American",
    "pizza_restaurant": "Italian",
    "seafood_restaurant": "Seafood",
    "vegetarian_restaurant": "Vegetarian",
    "vegan_restaurant": "Vegan",
    "steakhouse": "Steakhouse",
    "sushi_restaurant": "Japanese"
}

# Specify the path to your location history file
location_history_path = os.path.join("/flavorAI/sampledata", "location-history.json")

# Alternative paths to try if the main one doesn't work
alternative_paths = [
    os.path.join(os.getcwd(), "flavorAI", "sampledata", "location-history.json"),
    os.path.join(os.getcwd(), "sampledata", "location-history.json"),
    os.path.join(os.getcwd(), "location-history.json"),
    "flavorAI/sampledata/location-history.json",
    "sampledata/location-history.json",
    "location-history.json"
]

# Set up output directory
OUTPUT_DIR = os.path.join(os.getcwd(), "FlavorAI", "backend", "personaldata")
os.makedirs(OUTPUT_DIR, exist_ok=True)
print(f"Output directory set to: {OUTPUT_DIR}")

# Try to load the JSON location history
data = None
loaded_path = None

# Try the primary path first
try:
    print(f"Trying to load location history from primary path: {location_history_path}")
    print(f"Current working directory: {os.getcwd()}")
    if os.path.exists(location_history_path):
        with open(location_history_path, "r") as f:
            data = json.load(f)
        loaded_path = location_history_path
        print(f"Successfully loaded location history with {len(data)} entries")
    else:
        print(f"Primary path does not exist")
except Exception as e:
    print(f"Error with primary path: {e}")

# Try alternative paths if primary path fails
if data is None:
    for alt_path in alternative_paths:
        try:
            print(f"Trying alternative path: {alt_path}")
            if os.path.exists(alt_path):
                with open(alt_path, "r") as f:
                    data = json.load(f)
                loaded_path = alt_path
                print(f"Successfully loaded location history from {alt_path} with {len(data)} entries")
                break
            else:
                print(f"Path doesn't exist: {alt_path}")
        except Exception as e:
            print(f"Error with {alt_path}: {e}")

# If all paths failed, provide debugging information
if data is None:
    print("ERROR: Could not find or load location-history.json from any path")
    print("Checking directories structure for debugging...")
    
    # List current directory contents
    print("\nFiles in current directory:")
    try:
        files = os.listdir(".")
        for file in files:
            print(f"  - {file}")
    except Exception as e:
        print(f"  Error listing current directory: {e}")
    
    # Check parent directory if needed
    print("\nFiles in parent directory:")
    try:
        files = os.listdir("..")
        for file in files:
            print(f"  - {file}")
    except Exception as e:
        print(f"  Error listing parent directory: {e}")
        
    # Check if flavorAI directory exists
    if os.path.exists("flavorAI"):
        print("\nFiles in flavorAI directory:")
        try:
            files = os.listdir("flavorAI")
            for file in files:
                print(f"  - {file}")
        except Exception as e:
            print(f"  Error listing flavorAI directory: {e}")
            
    # Check if sampledata directory exists in current or parent
    for sample_dir in ["sampledata", "flavorAI/sampledata", "../sampledata"]:
        if os.path.exists(sample_dir):
            print(f"\nFiles in {sample_dir} directory:")
            try:
                files = os.listdir(sample_dir)
                for file in files:
                    print(f"  - {file}")
            except Exception as e:
                print(f"  Error listing {sample_dir} directory: {e}")
    
    sys.exit(1)

# Dictionary to store restaurant visits (simplified to just count)
restaurant_visits = defaultdict(lambda: {
    "name": "",
    "visit_count": 0,
    "visits": []
})

# Collect all unique placeIDs from visit entries
place_ids = {}
for entry in data:
    visit = entry.get("visit", {})
    top = visit.get("topCandidate", {})
    pid = top.get("placeID")
    if pid:
        place_ids[pid] = {
            "start": entry.get("startTime"),
            "end": entry.get("endTime"),
            "placeLocation": top.get("placeLocation", ""),
        }

print(f"Found {len(place_ids)} unique place IDs to analyze")

# Function to get place details
def get_place_details(place_id):
    url = f"https://maps.googleapis.com/maps/api/place/details/json?place_id={place_id}&key={API_KEY}"
    response = requests.get(url)
    if response.status_code == 200:
        return response.json()
    return None

# Check each placeID and add restaurant visits to our dictionary
restaurant_count = 0
print("Analyzing place visits...")

for place_id, info in place_ids.items():
    details = get_place_details(place_id)
    if not details or details.get("status") != "OK":
        continue
    
    types = details["result"].get("types", [])
    name = details["result"].get("name", "Unknown")
    
    if any(t in types for t in ["restaurant", "food", "cafe", "meal_takeaway", "bar"]):
        restaurant_count += 1
        print(f"\rProcessing restaurant {restaurant_count}: {name}", end="")
        
        # Get or create restaurant entry
        restaurant_key = name.lower()  # Use lowercase name as key for consistency
        
        # If this is the first time seeing this restaurant, set the name
        if restaurant_visits[restaurant_key]["visit_count"] == 0:
            restaurant_visits[restaurant_key]["name"] = name
        
        # Increment visit count
        restaurant_visits[restaurant_key]["visit_count"] += 1
        
        # Add this specific visit
        restaurant_visits[restaurant_key]["visits"].append({
            "start_time": info['start'],
            "end_time": info['end'],
            "place_id": place_id,
            "location": info['placeLocation']
        })
    
    time.sleep(0.2)  # Be kind to the API rate limit

print(f"\nDone! Analyzed {restaurant_count} restaurant visits across {len(restaurant_visits)} unique restaurants.")

# Create simplified restaurant visits data with just name and count
restaurant_visits_simple = {}
for restaurant_key, data in restaurant_visits.items():
    restaurant_visits_simple[data["name"]] = data["visit_count"]

# Write simplified results to JSON file
output_file = os.path.join(OUTPUT_DIR, "restaurant_visits.json")
try:
    with open(output_file, "w") as f:
        json.dump(restaurant_visits_simple, f, indent=2)
    print(f"Simplified restaurant data written to {output_file}")
except Exception as e:
    print(f"Error writing to {output_file}: {e}")
    # Try to create directories if they don't exist
    try:
        os.makedirs(os.path.dirname(output_file), exist_ok=True)
        with open(output_file, "w") as f:
            json.dump(restaurant_visits_simple, f, indent=2)
        print(f"Successfully created directories and wrote to {output_file}")
    except Exception as e2:
        print(f"Failed to create directories or write file: {e2}")
        # Fallback to current directory
        fallback_file = "restaurant_visits.json"
        with open(fallback_file, "w") as f:
            json.dump(restaurant_visits_simple, f, indent=2)
        print(f"Saved fallback file to current directory: {fallback_file}")

# Generate a summary of most visited restaurants
if restaurant_visits:
    print("\nMost visited restaurants:")
    sorted_restaurants = sorted(
        restaurant_visits_simple.items(), 
        key=lambda x: x[1], 
        reverse=True
    )
    
    for i, (name, count) in enumerate(sorted_restaurants[:10]):
        print(f"{i+1}. {name}: {count} visits")