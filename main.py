from flask import Flask, jsonify, send_file, abort, send_from_directory
import os
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

MUSIC_DIR = r"music"

def get_music_library():
    library = {}
    if not os.path.exists(MUSIC_DIR):
        return library

    for artist in sorted(os.listdir(MUSIC_DIR)):
        artist_path = os.path.join(MUSIC_DIR, artist)
        if not os.path.isdir(artist_path):
            continue

        albums = {}
        for album in sorted(os.listdir(artist_path)):
            album_path = os.path.join(artist_path, album)
            if not os.path.isdir(album_path):
                continue

            tracks = []
            cover_path = None
            for file in sorted(os.listdir(album_path)):
                if file.lower().endswith('.flac'):
                    tracks.append(file)
                elif file.lower() == 'cover.jpg':
                    cover_path = file

            albums[album] = {
                "cover": cover_path,
                "tracks": tracks
            }
        library[artist] = albums
    return library

@app.route('/')
def index():
    return send_from_directory('static', 'index.html')

@app.route('/api/library')
def library():
    data = get_music_library()
    return jsonify(data)

@app.route('/api/music/<artist>/<album>/<filename>')
def serve_music(artist, album, filename):
    file_path = os.path.join(MUSIC_DIR, artist, album, filename)
    if os.path.exists(file_path):
        return send_file(file_path, mimetype='audio/flac')
    else:
        abort(404)

@app.route('/api/cover/<artist>/<album>')
def serve_cover(artist, album):
    cover_path = os.path.join(MUSIC_DIR, artist, album, 'cover.jpg')
    if os.path.exists(cover_path):
        return send_file(cover_path, mimetype='image/jpeg')
    else:
        abort(404)

if __name__ == '__main__':
    app.run(debug=True, port=80)
