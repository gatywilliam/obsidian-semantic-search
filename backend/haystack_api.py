
# def get_query():
#     # This function will return the query that the user wants to search for.
#     # Eventually, this function will be edited to be a function that will get the query from the javascript frontend.
#     # For now, it will just return a string that the user inputs.
#     return input("Please enter the query you would like to search for: ")


# def return_results(results):
#     # This function will return the results from the query to the user.
#     # Eventually, this function will be edited to be a function that will return the results to the javascript frontend.
#     # For now, it will just print the results to the console.
#     print(results["retriever"]["documents"][:3])

# def continue_running():
#     # This function will return a boolean value that will determine if the program should continue running.
#     # Eventually, this function will be edited to be a function that will turn off the program when the user closes the frontend.
#     # For now, it will just return a boolean value that the user inputs.
#     text_answer = input("Would you like to continue running the program? (True/False): ")
#     return text_answer.lower() == "true"

from flask import Flask, Response, request, send_file, jsonify
from flask_socketio import SocketIO, emit
from flask_cors import CORS, cross_origin
import socketio
import json

app = Flask(__name__)
cors = CORS(app)
app.config['CORS_HEADERS'] = 'Content-Type'
sio = socketio.Client()

RESULTS = None
QUERY = None
CONTINUE_RUNNING = True

socket_io = SocketIO(app, cors_allowed_origins="*", logger=True)
socket_io.init_app(app, cors_allowed_origins="*")

def get_query():
    return QUERY

@app.route('/get_query', methods=['POST'])
def get_query_POST():
    QUERY = request.get_json(force=True).get('input').lower()

# def return_results(results):
#     return RESULTS["retriever"]["documents"][:3]

@app.route('/return_results', methods=['GET'])
def return_results(results):
    results["retriever"]["documents"][:3]

@app.route('/continue_running', methods=['POST'])
def continue_running_POST():
    CONTINUE_RUNNING = request.get_json(force=True).get('input').lower() == "true"

def continue_running():
    return CONTINUE_RUNNING

if __name__ == "__main__":
    socket_io.run(app, host='0.0.0.0', port=5000, debug=True)
