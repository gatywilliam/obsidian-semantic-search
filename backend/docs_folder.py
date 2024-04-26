# Use this script to grab all of the files within a user defined folder and the subfolders within that folder.

import os
import sys
import unicodedata


def unicodeToAscii(s):
    return ''.join(
        c for c in unicodedata.normalize('NFD', s)
        if unicodedata.category(c) != 'Mn'
    )


def get_files_in_folder(folder_path):
    """
    This function will return all the files within a folder and its subfolders.
    :param folder_path: The path to the folder you want to search.
    :return: A list of all the files within the folder and its subfolders.
    """
    files = []
    for path, subdirs, filenames in os.walk(folder_path):
        for name in filenames:
            files.append(os.path.join(path, name))    

    documents = []
    # Grab all text in the files
    for file in files:
        with open(file, 'r', encoding= 'utf-8') as f:
        # with open(file, 'r') as f:
            text = f.read()
            documents.append(unicodeToAscii(text.strip()))

    return documents