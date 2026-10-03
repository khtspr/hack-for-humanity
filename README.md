# HomeMatch 🏠

> **Find a home based on where your life happens — not just where you think you should live.**

## 1. The Problem

Finding somewhere to live is difficult.

Traditional property platforms primarily ask users **where they want to live**, then allow them to filter listings by criteria such as price, number of bedrooms, and property type.

But most people don't actually need to live in one specific area.

What they really care about is:

- Can I get to work easily?
- Can I afford the property?
- How long will my commute take?
- Can I get there without a car?
- Is there useful public transport nearby?
- If I drive, is parking available?

This creates a discovery problem: **a suitable home may exist somewhere the user never thought to search.**

## 2. Our Solution

**HomeMatch** is a smarter housing search platform inspired by the discovery experience of services such as Skyscanner.

Instead of starting with:

> "Where do you want to live?"

HomeMatch starts with:

> **"Where do you need to go?"**

The user provides information about their lifestyle, priorities and budget. HomeMatch then searches across available properties and recommends homes based on their overall suitability.

It can also recommend properties that don't perfectly satisfy every preference but may represent a better overall choice.

For example:

> A user wants an apartment close to their workplace for €1,800/month.

> HomeMatch discovers a €1,800/month apartment that is not very close to their workplace in walking distance, but it sits directly beside a tram station and doesn't require the user to own a car or walk.

The user would've normally not discovered that place because of the distance using a traditional home search engine. HomeSearch helps people find places that normally would appear too far and therefore not even get found.

---

# 3. Core Principle

## Search by your life, not by location.

Existing property search:

**Area → Properties**

HomeMatch:

**Work/school location → Properties**

This shifts housing search from a **neighbourhood or geographical distance search** into a **commute-based search** which includes places that appear far but are well connected, and discludes places that appear not too far but aren't connected via public transit at all.

---

# 4. Target Users

HomeMatch could support both:

### Renters

People searching for apartments, houses, rooms or other rental accommodation.

### Buyers

People looking to purchase a home who may be unfamiliar with areas that fit their lifestyle and commuting requirements.

It is particularly useful for:

- People moving to a new city
- Students
- Young professionals
- Families
- People changing jobs
- People without cars
- Remote/hybrid workers
- People struggling to find housing within their preferred area

---

# 5. User Inputs

## Essential

### Budget
- Maximum monthly rent
- Purchase budget
- Flexible/strict budget
- Number of rooms

### Important Locations
Users can enter the places they/their family needs to go to.
HomeMatch should accomodate for every member of the house, it should not be just for a single student.

Examples:

- Workplaces
- University/school
- Kindergarten
- Family (parents' house)
- City centre
- Grocery store



### Transport Preferences

Users select transport methods available to them:

- 🚗 Driving
- 🚆 Train
- 🚌 Bus
- 🚲 Cycling
- 🚶 Walking

The system can consider:

- Journey time
- Public transport connections
- Nearby stations/stops
- Parking availability
- Cycling routes
- Walking distance

### Property Preferences

- Rent / Buy
- Property type
- Bedrooms
- Bathrooms
- Furnished/unfurnished
- Minimum size
- Other preferences

---

# 6. Smart Matching

Instead of applying every preference as a strict filter, HomeMatch assigns each property a **Match Score**.

Example:

## 91% Match

**€1,650/month**

✅ 22-minute commute to work  
✅ Train station 4 minutes away  
✅ Within budget  
✅ 2 bedrooms  
⚠️ 12 minutes farther from city centre than requested  

This gives users much more information than a traditional search result.

### Example Scoring Model

For the hackathon prototype:

```text
Match Score =
    35% affordability
  + 30% commute
  + 15% transport connectivity
  + 10% property requirements
  + 10% lifestyle preferences
```

The weights could eventually be customised based on what matters most to each user.

---

# 7. Discovery / "Advanced Search"

One of HomeMatch's key features is deliberately showing users **good options outside their original assumptions**.

For example:

> "This home is 36 minutes away (20% further away) despite your search for a 30 minute commute. However, it is below your budget"

Or:

> "This home exceeds your budget by 10%, but matches your preferences."

Or:

> "You selected driving, but this property has a direct train connection to your workplace and could remove the need for a daily car commute."

HomeMatch should always explain **why a recommendation is being shown**.

# 8. Main Screens

For the hackathon MVP, focus on approximately **four screens**.

### 1. Landing Page

Headline:

**Find a home that fits your life.**

CTA:

**Find my home**

### 2. Preferences

Simple onboarding asking for the user inputs under heading #5.

### 3. Results

Map + property cards ranked by Match Score.

Each card should immediately show:

- Price
- Commute time
- Transport type for the commute time shown
- Number of rooms

### 4. Property Detail

Shows the property alongside an explanation of **why it matches the user**.

---

# 10. Hackathon MVP

The goal is NOT to recreate Daft.ie.

The goal is to prove that **a better housing discovery model is possible.**

### Build

- Preference onboarding
- Small dataset of sample properties
- Match Score algorithm
- Ranked recommendation page
- Commute information
- Map if practical
- "Why we recommended this" explanation

### Don't Build

For the hackathon, avoid spending significant time on:

- User authentication
- Payments
- Messaging landlords
- Real estate agent accounts
- Large property databases
- Full listing management
- Complex recommendation AI
- Production infrastructure

Fake/mock data is sufficient to demonstrate the concept unless the hackathon specifically requires live data.

---

# 11. Example Demo

### User

**Profile**

Works at: Google Dublin  
Budget: €2,000/month  
Needs: 1+ bedroom  
Transport: Bike + public transport  
Maximum commute: 30 minutes

### Traditional Search

The user needs to decide which Dublin neighbourhoods to search individually on a site like daft.ie

### HomeMatch

HomeMatch searches properties based on their accessibility to the user's workplace.

Results might include:

**92% — Property A**

- €1,850/month
- 18-minute cycle
- Direct bus connection
- Within budget

**87% — Property B**

- €1,650/month
- 27-minute train/bus journey
- €200/month cheaper
- Outside the area the user originally considered

HomeMatch explains the trade-off instead of simply excluding Property B.

---

# 12. Technical Architecture

A simple hackathon architecture could be:

```text
Frontend
   ↓
User Preferences
   ↓
Matching Engine
   ↓
Property Dataset
   +
Transport / Routing Data
   ↓
Match Scores
   ↓
Ranked Properties
```

Potential components:

### Frontend
React / Next.js

### Backend
Node.js / Python

### Property Data
Mock dataset or available property API/dataset

### Maps / Routing
Google Maps or similar

### Matching Engine
Simple weighted scoring algorithm

No machine learning is necessary for the MVP.

---

# 13. Future Features

With additional development, HomeMatch could include:

- Real property feeds
- Multiple workplaces/destinations
- Hybrid-working schedules
- Schools and childcare
- Healthcare accessibility
- Grocery stores and amenities
- Accessibility requirements
- Safety and environmental information
- Commute cost estimation
- Car ownership cost comparison
- Parking costs
- Personalised recommendation learning
- Saved searches
- Alerts when high-match properties appear
- Comparison between properties

Don't implement them for the MVP.

---

# 14. Impact

Housing availability cannot be solved solely by improving search.

However, **housing discovery can be improved.**

HomeMatch can help people:

- Discover areas they hadn't considered
- Find housing compatible with public transport
- Find more listings without manually researching every district or searching the entire city.

Instead of asking people to understand an entire city's transport network and how its linked to every part of a city before searching, HomeMatch performs that analysis for them.

---

# 15. Elevator Pitch

**HomeMatch is Skyscanner for housing.**

Traditional property websites ask you where you want to live.

We ask **where you need to go**.

Tell HomeMatch where you work and your budget. We find properties based on how far they actually are for where you need to be, helping you find places that appear far but are easy to commute from thanks to public transit and road connections.

**Don't search neighbourhoods. Search for the home that fits your life.**