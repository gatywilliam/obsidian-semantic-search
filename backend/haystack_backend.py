from haystack import Document
from haystack.document_stores.in_memory import InMemoryDocumentStore
from haystack.components.embedders import SentenceTransformersTextEmbedder, SentenceTransformersDocumentEmbedder
from haystack.components.retrievers.in_memory import InMemoryEmbeddingRetriever
import docs_folder
from haystack import Pipeline
import os
import haystack_api

document_store = InMemoryDocumentStore(embedding_similarity_function="cosine")

path = os.path.join(os.getcwd(), "docs")
documents_read, files = docs_folder.get_files_in_folder(path)

documents = [Document(content=document, meta={"name": os.path.basename(file)}) for file, document in zip(files, documents_read)]

document_embedder = SentenceTransformersDocumentEmbedder(
    model="BAAI/bge-large-en-v1.5")  

document_embedder.warm_up()

documents_with_embeddings = document_embedder.run(documents)["documents"]

document_store.write_documents(documents_with_embeddings)

query_pipeline = Pipeline()
query_pipeline.add_component("text_embedder", SentenceTransformersTextEmbedder(model="BAAI/bge-large-en-v1.5"))
query_pipeline.add_component("retriever", InMemoryEmbeddingRetriever(document_store=document_store))
query_pipeline.connect("text_embedder.embedding", "retriever.query_embedding")

run = True
while run:
    query = haystack_api.get_query()
    results = query_pipeline.run({"text_embedder": {"text": query}})
    get_results = haystack_api.return_results(results)
    print(get_results)
    run = haystack_api.continue_running()