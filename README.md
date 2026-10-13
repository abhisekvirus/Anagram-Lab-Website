# Anagram Lab

A responsive anagram detection and practice website built with Flask, HTML, CSS, and JavaScript.

## Features
- Anagram checker with character frequency breakdown
- Practice rounds with difficulty selection
- Progressive hints and score tracking
- Responsive aesthetic interface and dark mode
- Keyboard support for the checker
- Local question generation; no external API key required

## Requirements
- Python 3.9+
- pip

## Run locally
```bash
python -m venv .venv
```
Activate the environment, then install dependencies:
```bash
pip install -r requirements.txt
python app.py
```
Open the local URL printed in the terminal (usually http://127.0.0.1:5000).

## Notes
Practice questions are generated locally. This starter version does not use an LLM or Google Search API. Do not deploy Flask's debug server as a production server; use a production WSGI server such as Gunicorn on a suitable host.
