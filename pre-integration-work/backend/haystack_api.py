
def get_query():
    # This function will return the query that the user wants to search for.
    # Eventually, this function will be edited to be a function that will get the query from the javascript frontend.
    # For now, it will just return a string that the user inputs.
    return input("Please enter the query you would like to search for: ")


def return_results(results):
    # This function will return the results from the query to the user.
    # Eventually, this function will be edited to be a function that will return the results to the javascript frontend.
    # Return the top 3 results to the user, including the document names.
    top_results = []
    for i, result in enumerate(results["retriever"]["documents"][:3]):
        document_name = result.meta.get("name", "")
        top_results.append({"rank": i + 1, "document_name": document_name, "content": result.content})

    return top_results

def continue_running():
    # This function will return a boolean value that will determine if the program should continue running.
    # Eventually, this function will be edited to be a function that will turn off the program when the user closes the frontend.
    # For now, it will just return a boolean value that the user inputs.
    text_answer = input("Would you like to continue running the program? (True/False): ")
    return text_answer.lower() == "true"
