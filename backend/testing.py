from haystack import Document
from haystack.document_stores.in_memory import InMemoryDocumentStore
from haystack.document_stores.types import DuplicatePolicy
from haystack.components.embedders import SentenceTransformersTextEmbedder, SentenceTransformersDocumentEmbedder
from haystack.components.retrievers.in_memory import InMemoryEmbeddingRetriever
import docs_folder
from haystack import Pipeline
import os
import haystack_api
from flask import Flask, Response, request, send_file, jsonify
from flask_socketio import SocketIO, emit
from flask_cors import CORS, cross_origin
import socketio
import random
import re

# app = Flask(__name__)
# cors = CORS(app)
# app.config['CORS_HEADERS'] = 'Content-Type'
# sio = socketio.Client()

# socket_io = SocketIO(app, cors_allowed_origins="*", logger=True)
# socket_io.init_app(app, cors_allowed_origins="*")

# "C:\\Users\\wgaty\\Documents\\School\\Spring 23-24\\NLP\\Term Project Local\\Documents\\sparknotes\\literature"

RESULTS = None
QUERY = None
CONTINUE_RUNNING = True
QUERY_PIPELINE = Pipeline()
EMBEDDINGS_MADE = False
NUM_RESULTS = 1
DOCUMENTS_READ = None
DOCS_PATH = "C:\\Users\\wgaty\\Documents\\School\\Spring 23-24\\NLP\\Term Project Local\\Documents\\sparknotes\\literature"
ALT_DOCS_PATH = "C:\\Users\\wgaty\\Documents\\School\\Spring 23-24\\NLP\\temp_test_data\data_zipped\\notes"
FILES = None


def check_embeddings():
    global EMBEDDINGS_MADE
    print(str(EMBEDDINGS_MADE))
    return jsonify({"embeddings_status": str(EMBEDDINGS_MADE).lower()})


def run_startup():
    document_store = InMemoryDocumentStore(embedding_similarity_function="cosine")

    # path = request.get_json(force=True).get('path')

    # path = os.path.join(os.getcwd(), "docs") #TODO replace

    global DOCUMENTS_READ
    global DOCS_PATH
    global FILES
    # DOCUMENTS_READ = docs_folder.get_files_in_folder(DOCS_PATH)
    DOCUMENTS_READ, FILES = docs_folder.get_files_in_folder(ALT_DOCS_PATH)
    # print(DOCUMENTS_READ)

    documents = [Document(content=document, meta={"name": os.path.basename(file)}) for file, document in zip(FILES, DOCUMENTS_READ)]

    document_embedder = SentenceTransformersDocumentEmbedder(
        model="BAAI/bge-large-en-v1.5")
    document_embedder.warm_up()

    documents_with_embeddings = document_embedder.run(documents)["documents"]

    document_store.write_documents(documents_with_embeddings, policy=DuplicatePolicy.SKIP)

    QUERY_PIPELINE.add_component("text_embedder", SentenceTransformersTextEmbedder(model="BAAI/bge-large-en-v1.5"))
    QUERY_PIPELINE.add_component("retriever", InMemoryEmbeddingRetriever(document_store=document_store))
    QUERY_PIPELINE.connect("text_embedder.embedding", "retriever.query_embedding")
    global EMBEDDINGS_MADE
    EMBEDDINGS_MADE = True
    print(EMBEDDINGS_MADE)
    # return 'Success'


def get_query(q):
    # global QUERY
    # QUERY = request.get_json(force=True).get('input').lower()
    # global RESULTS
    r = QUERY_PIPELINE.run({"text_embedder": {"text": q}})
    return r


def return_results():
    global RESULTS
    global NUM_RESULTS
    docs = RESULTS["retriever"]["documents"]
    # query_results = []
    # for i in range(NUM_RESULTS):
    #     print(docs[i])
    #     #"title": docs[i].meta["name"], 
    #     query_results.append({"content": docs[i].content})
    # json = {"results": query_results}
    # json = {"results": RESULTS["retriever"]["documents"][:3]}
    return docs[0]


def run_query(q):
    r = QUERY_PIPELINE.run({"text_embedder": {"text": q}})
    return r["retriever"]["documents"][0].content

# def continue_running():
#     if request.get_json(force=True).get('input').lower() == "false":
#         socket_io.stop()
#         global CONTINUE_RUNNING
#         CONTINUE_RUNNING = False
#     return 'Success'

def setup_test_docs():
    docs = set()
    while len(docs) < 10:
        docs.add(random.randint(0, len(DOCUMENTS_READ)-1))
    return docs

def grab_test_doc(doc_text):
    # with open(doc_path) as f:
    #     doc_text = f.read()
    split_doc = doc_text.split(".")
    # split_doc = doc_text.split("\n")
    # split_doc = re.split(r'\n|.', doc_text)
    # print(doc_text)
    # print(split_doc)
    # print("DOC TEXT")
    # print(doc_text)
    # split_doc = doc_text.split(".")
    # print("\n")
    # print("SPLIT DOC ON .")
    # print(split_doc)
    # split_doc = ' '.join(doc_text)
    # print("\n")
    # print("SPLIT DOC ON . JOINED ON SPACE")
    # print(split_doc)
    # split_doc = split_doc.split("\n")
    # print("\n")
    # print("SPLIT DOC ON \\n")
    # print(split_doc)
    # print("\n")
    start_idx = random.randint(0, len(split_doc)-4) if len(split_doc)-4 > 0 else -1
    end_idx = start_idx + 3
    passage = split_doc[0:-1] if start_idx == -1 else split_doc[start_idx:end_idx]
    # print("PASSAGE JOINED ON .SPACE")
    # print('. '.join(passage))
    return ('. '.join(passage), doc_text)
    # return ('\n'.join(passage), doc_text)


def grab_test_doc_single(doc_text):
    # with open(doc_path) as f:
    #     doc_text = f.read()
    # split_doc = doc_text.split("\n")
    split_doc = doc_text.split(".")
    # split_doc = re.split(r'\n|.', doc_text)
    # split_doc = doc_text.split(".")
    # split_doc = ' '.join(doc_text)
    # split_doc = split_doc.split("\n")
    # start_idx = random.randint(0, len(split_doc)-4) if len(split_doc)-4 > 0 else -1
    # end_idx = start_idx + 3
    idx = random.randint(0, len(split_doc)-1)
    passage = split_doc[idx]
    return ('. '.join(passage), doc_text)
    # return ('\n'.join(passage), doc_text)


if __name__ == "__main__":
    run_startup()
    docs_seen = 0
    total_score = 0
    for i in range(100):
        docs = list(setup_test_docs())
        results = []
        for j in range(len(docs)):
            # with open([docs[i]]) as f:
            #     doc_text = f.read()
            d = grab_test_doc(DOCUMENTS_READ[docs[j]])
            result = run_query(d[0])
            docs_seen += 1
            if result == d[1]:
                results.append(1)
                total_score += 1
            else:
                results.append(0)
        print(f'Iteration #{i}: {sum(results)/len(docs)}')
    docs_seen_single = 0
    total_score_single = 0
    for i in range(100):
        docs = list(setup_test_docs())
        results = []
        for j in range(len(docs)):
            # with open([docs[i]]) as f:
            #     doc_text = f.read()
            d = grab_test_doc_single(DOCUMENTS_READ[docs[j]])
            result = run_query(d[0])
            docs_seen_single += 1
            if result == d[1]:
                results.append(1)
                total_score_single += 1
            else:
                results.append(0)
        print(f'Iteration #{i}: {sum(results)/len(docs)}')
    score_on_all = 0
    docs_seen_all = 0
    for i in range(len(DOCUMENTS_READ)):
        d = grab_test_doc(DOCUMENTS_READ[i])
        result = run_query(d[0])
        docs_seen_all += 1
        if result == d[1]:
            results.append(1)
            score_on_all += 1
        else:
            results.append(0)
    score_on_all_single = 0
    docs_seen_all_single = 0
    for i in range(len(DOCUMENTS_READ)):
        d = grab_test_doc_single(DOCUMENTS_READ[i])
        result = run_query(d[0])
        docs_seen_all_single += 1
        if result == d[1]:
            results.append(1)
            score_on_all_single += 1
        else:
            results.append(0)
    print(f'RAN IN BATCHES (3 passages): docs seen: {docs_seen}; docs correct: {total_score}; score: {total_score/docs_seen}')
    print(f'RAN IN BATCHES (1 passage): docs seen: {docs_seen_single}; docs correct: {total_score_single}; score: {total_score_single/docs_seen_single}')
    print(f'ALL DOCS ONCE (3 passages): docs seen: {docs_seen_all}; docs correct: {score_on_all}; score: {score_on_all/docs_seen_all}')
    print(f'ALL DOCS ONCE (1 passage): docs seen: {docs_seen_all_single}; docs correct: {score_on_all_single}; score: {score_on_all_single/docs_seen_all_single}')
