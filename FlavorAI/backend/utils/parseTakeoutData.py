import json
import requests
import time
import importlib.util
import sys
import os

api_key_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "../..", "APIkey.py"))
spec = importlib.util.spec_from_file_location("APIkey", api_key_path)
api_key_module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(api_key_module)

API_KEY = api_key_module.otherAPI_key







# Load the JSON location history
with open("location-history.json", "r") as f:
    data = json.load(f)

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

# Function to get place details
def get_place_details(place_id):
    url = f"https://maps.googleapis.com/maps/api/place/details/json?place_id={place_id}&key={API_KEY}"
    response = requests.get(url)
    if response.status_code == 200:
        return response.json()
    return None

# Check each placeID and print if it's a restaurant
for place_id, info in place_ids.items():
    details = get_place_details(place_id)
    if not details or details.get("status") != "OK":
        continue
    types = details["result"].get("types", [])
    name = details["result"].get("name", "Unknown")
    
    if any(t in types for t in ["restaurant", "food", "cafe", "meal_takeaway", "bar"]):
        print(f"\n🍽️ Possible restaurant visit:")
        print(f" - Name: {name}")
        print(f" - Place ID: {place_id}")
        print(f" - Types: {types}")
        print(f" - Start: {info['start']}")
        print(f" - End:   {info['end']}")
        print(f" - Location: {info['placeLocation']}")

    time.sleep(0.2)  # Be kind to the API rate limit
