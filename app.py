from flask import Flask, render_template, request, jsonify
from collections import Counter
import random
import unicodedata
import uuid

app = Flask(__name__)

WORDS = {
    "easy": ["listen", "silent", "earth", "heart", "night", "thing", "cat", "act",
             "dusty", "study", "save", "vase", "angel", "glean", "below", "elbow"],
    "medium": ["triangle", "integral", "astronomer", "moon starer", "conversation",
               "voices rant on", "school master", "the classroom", "dormitory", "dirty room"],
    "hard": ["eleven plus two", "twelve plus one", "the eyes", "they see",
             "a gentleman", "elegant man", "debit card", "bad credit",
             "astronomers", "no more stars"]
}

def normalize(value):
    value = unicodedata.normalize("NFKC", value).casefold()
    return "".join(c for c in value if c.isalnum())

def is_anagram(a, b):
    na, nb = normalize(a), normalize(b)
    return bool(na and nb) and Counter(na) == Counter(nb)

def make_question(difficulty="easy"):
    pairs = WORDS.get(difficulty, WORDS["easy"])
    # Pick a seed and randomly decide whether to make a positive or negative question.
    seed = random.choice(pairs)
    normalized = normalize(seed)
    positive = random.random() < 0.5
    chars = list(normalized)
    if positive:
        for _ in range(20):
            random.shuffle(chars)
            candidate = "".join(chars)
            if candidate != normalized:
                break
        else:
            candidate = normalized
        first, second = seed, candidate
        answer = is_anagram(first, second)
    else:
        random.shuffle(chars)
        candidate = "".join(chars)
        # Always force a frequency mismatch, regardless of the shuffle.
        candidate = candidate + random.choice("xyz")
        first, second = seed, candidate
        answer = False
    return {
        "id": str(uuid.uuid4()),
        "difficulty": difficulty,
        "first": first,
        "second": second,
        "answer": answer,
        "length_first": len(normalize(first)),
        "length_second": len(normalize(second))
    }

@app.get("/")
def index():
    return render_template("index.html")

@app.post("/api/question")
def question():
    data = request.get_json(silent=True) or {}
    difficulty = data.get("difficulty", "easy")
    if difficulty not in WORDS:
        difficulty = "easy"
    return jsonify(make_question(difficulty))

@app.post("/api/check")
def check():
    data = request.get_json(silent=True) or {}
    first = str(data.get("first", ""))
    second = str(data.get("second", ""))
    if not normalize(first) or not normalize(second):
        return jsonify({"error": "Enter two strings containing at least one letter or number."}), 400
    a, b = Counter(normalize(first)), Counter(normalize(second))
    return jsonify({
        "is_anagram": a == b,
        "first_frequency": dict(sorted(a.items())),
        "second_frequency": dict(sorted(b.items())),
        "extra_first": dict(a - b),
        "extra_second": dict(b - a),
        "normalized_first": normalize(first),
        "normalized_second": normalize(second),
        "time_complexity": "O(n) average",
        "space_complexity": "O(k)"
    })

@app.post("/api/hint")
def hint():
    data = request.get_json(silent=True) or {}
    level = max(1, min(3, int(data.get("level", 1))))
    first, second = str(data.get("first", "")), str(data.get("second", ""))
    na, nb = normalize(first), normalize(second)
    if level == 1:
        message = "Ignore the order of the letters. Focus on which characters appear."
    elif level == 2:
        message = f"After normalization, the strings contain {len(na)} and {len(nb)} characters."
    else:
        message = "Compare the frequency of every character. Each character must appear the same number of times."
    return jsonify({"hint": message})

if __name__ == "__main__":
    app.run(debug=True)
