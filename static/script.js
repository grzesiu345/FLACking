const API_BASE = '/api';
  let libraryData = {};
  let playQueue = [];
  let currentIndex = -1;

  const elems = {
    albums: document.getElementById('albums'),
    search: document.getElementById('search'),
    albumDetails: document.getElementById('album-details'),
    albumCover: document.getElementById('album-cover'),
    albumTitle: document.getElementById('album-title'),
    albumArtist: document.getElementById('album-artist'),
    playAlbumBtn: document.getElementById('play-album-btn'),
    trackListBody: document.getElementById('track-list-body'),

    npCover: document.getElementById('np-cover'),
    npTitle: document.getElementById('np-title'),
    npArtist: document.getElementById('np-artist'),
    audio: document.getElementById('audio'),
    currentTime: document.getElementById('current-time'),
    duration: document.getElementById('duration'),
    seek: document.getElementById('seek'),
    playBtn: document.getElementById('play'),
    prevBtn: document.getElementById('prev'),
    nextBtn: document.getElementById('next'),
    volume: document.getElementById('volume'),
  };

  fetch(API_BASE + '/library')
    .then(res => res.json())
    .then(data => {
      libraryData = data;
      renderAlbums();
    });

  function renderAlbums(filter = '') {
    elems.albums.innerHTML = '';
    for (const artist in libraryData) {
      for (const album in libraryData[artist]) {
        if (!album.toLowerCase().includes(filter) && !artist.toLowerCase().includes(filter)) continue;
        const item = document.createElement('div');
        item.className = 'album-item';
        const img = document.createElement('img');
        img.src = `${API_BASE}/cover/${encodeURIComponent(artist)}/${encodeURIComponent(album)}`;
        const title = document.createElement('div');
        title.className = 'title';
        title.textContent = album;
        const art = document.createElement('div');
        art.className = 'artist';
        art.textContent = artist;
        item.append(img, title, art);
        item.onclick = () => showAlbumDetails(artist, album);
        elems.albums.appendChild(item);
      }
    }
  }

  function showAlbumDetails(artist, album) {
    elems.albumDetails.classList.remove('hidden');
    elems.albumCover.src = `${API_BASE}/cover/${encodeURIComponent(artist)}/${encodeURIComponent(album)}`;
    elems.albumTitle.textContent = album;
    elems.albumArtist.textContent = artist;
    const tracks = libraryData[artist][album].tracks;
    elems.trackListBody.innerHTML = '';
    tracks.forEach((file, i) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${i + 1}</td><td>${file.replace(/^\d+\.\s*/, '').replace(/\.flac$/i, '')}</td>`;
      tr.onclick = () => {
        currentIndex = i;
        playQueue = tracks.map(f => ({ artist, album, file: f }));
        playCurrent();
      };
      elems.trackListBody.appendChild(tr);
    });
    playQueue = tracks.map(f => ({ artist, album, file: f }));
    currentIndex = 0;
  }

  function playCurrent() {
    if (currentIndex < 0 || currentIndex >= playQueue.length) return;
    const { artist, album, file } = playQueue[currentIndex];
    elems.audio.src = `${API_BASE}/music/${encodeURIComponent(artist)}/${encodeURIComponent(album)}/${encodeURIComponent(file)}`;
    elems.audio.play();
    updateNowPlaying(artist, album, file);
  }

  function updateNowPlaying(artist, album, file) {
    elems.npCover.src = `${API_BASE}/cover/${encodeURIComponent(artist)}/${encodeURIComponent(album)}`;
    elems.npTitle.textContent = file.replace(/^\d+\.\s*/, '').replace(/\.flac$/i, '');
    elems.npArtist.textContent = artist;
    elems.playBtn.textContent = '⏸️';
  }

  elems.playAlbumBtn.onclick = () => playCurrent();

  elems.playBtn.onclick = () => {
    if (elems.audio.paused) {
      elems.audio.play();
      elems.playBtn.textContent = '⏸️';
    } else {
      elems.audio.pause();
      elems.playBtn.textContent = '▶️';
    }
  };
  elems.prevBtn.onclick = () => {
    if (currentIndex > 0) {
      currentIndex--;
      playCurrent();
    }
  };
  elems.nextBtn.onclick = () => {
    if (currentIndex < playQueue.length - 1) {
      currentIndex++;
      playCurrent();
    }
  };

  elems.audio.ontimeupdate = () => {
    const ct = elems.audio.currentTime;
    const d = elems.audio.duration || 0;
    elems.currentTime.textContent = formatTime(ct);
    elems.duration.textContent = formatTime(d);
    elems.seek.value = d ? (ct / d) * 100 : 0;
  };

  elems.audio.onended = () => {
    const autoplay = localStorage.getItem('autoplay') !== 'false';
    if (autoplay && currentIndex < playQueue.length - 1) {
      currentIndex++;
      playCurrent();
    } else {
      elems.playBtn.textContent = '▶️';
    }
  };

  elems.seek.oninput = () => {
    const d = elems.audio.duration || 0;
    elems.audio.currentTime = (elems.seek.value / 100) * d;
  };

  elems.volume.oninput = () => {
    elems.audio.volume = elems.volume.value;
  };

  elems.search.oninput = e => {
    const q = e.target.value.trim().toLowerCase();
    renderAlbums(q);
    elems.albumDetails.classList.add('hidden');
  };

  function formatTime(sec) {
    const m = Math.floor(sec / 60).toString().padStart(2, '0');
    const s = Math.floor(sec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  }

  const settingsBtn = document.getElementById('settings-btn');
  const settingsPanel = document.getElementById('settings-panel');
  const toggleAutoplay = document.getElementById('toggle-autoplay');

  settingsBtn.onclick = () => {
    settingsPanel.style.display = settingsPanel.style.display === 'flex' ? 'none' : 'flex';
  };

  toggleAutoplay.onchange = () => {
    localStorage.setItem('autoplay', toggleAutoplay.checked);
  };

  window.onload = () => {
    const auto = localStorage.getItem('autoplay') !== 'false';
    toggleAutoplay.checked = auto;
  };