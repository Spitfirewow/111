const apiKey = '1P2IShy91gDLXOmgRvgvDVIk94PkJYPs';

const blockSize = 20;

function Model() {
  this.currentGifs = [];
  this.request = '';
}

Model.prototype.Load = async function () {
  const url = `https://api.giphy.com/v1/gifs/search?api_key=${apiKey}&q=${this.request}&limit=${blockSize}&offset=${this.currentGifs.length}&rating=G&lang=en`;
  const request = new Request(url, { cache: 'default' });
  const result = (await (await fetch(request)).json()).data;
  this.currentGifs = result.length ? this.currentGifs.concat(result) : [];
};

Model.prototype.LoadById = async function (id) {
  const url = `https://api.giphy.com/v1/gifs/${id}?api_key=${apiKey}`;
  const request = new Request(url, { cache: 'default' });
  const result = (await (await fetch(request)).json()).data;
  return result;
};

function View(model) {
  this.model = model;
  this.currentDisplayed = 0;
}

function hide(element) {
  document.querySelector(element).style.display = 'none';
}

function show(element) {
  document.querySelector(element).style.display = 'unset';
}

View.prototype.RemoveGifs = function () {
  const gifs = document.getElementsByClassName('gifWrapper');
  while (gifs.length) gifs[0].parentNode.removeChild(gifs[0]);
  this.currentDisplayed = 0;
  show('.failMsg');
  hide('.moreBtn');
};

View.prototype.DisplayGifs = function () {
  let i = blockSize;
  const gifsContainer = document.getElementById('gifsContainer');
  const documentFragment = document.createDocumentFragment();
  const template = document.getElementById('gifTpl');
  while (i-- && this.currentDisplayed < this.model.currentGifs.length) {
    documentFragment.appendChild(CreateGif(template.content.cloneNode(true), this.model.currentGifs[this.currentDisplayed++]));
  }
  gifsContainer.appendChild(documentFragment);
  show('.moreBtn');
};

View.prototype.DisplayRequest = async function () {
  await this.model.Load();
  if (this.model.currentGifs.length) {
    hide('.failMsg');
    this.DisplayGifs();
  }
};

function CreateGifInfo(node, data) {
  CreateGif(node, data, false);
  node.querySelector('.gifName').textContent = `Name: ${data.title}`;
  node.querySelector('.gifDate').textContent = `Date: ${data.import_datetime}`;
  node.querySelector('.gifAuthorName').textContent = `Author: ${data.username}`;
  node.querySelector('.gifAuthorPicture').style.backgroundImage = `url("${data.user.avatar_url}")`;
  node.querySelector('.gifAuthorPicture').style.width = '100px';
  node.querySelector('.gifAuthorPicture').style.height = '100px';
  node.querySelector('.gifAuthorPicture').style.backgroundSize = 'contain';
  return node;
}

function OpenGif(data) {
  model.currentGifs = [];
  view.RemoveGifs();
  hide('.requestWrapper');
  const gifsContainer = document.getElementById('gifInfoContainer');
  const documentFragment = document.createDocumentFragment();
  const template = document.getElementById('gifInfoTpl');
  documentFragment.appendChild(CreateGifInfo(template.content.cloneNode(true), data));
  gifsContainer.appendChild(documentFragment);
  show('.backBtn');
  hide('.failMsg');
}

function CreateGif(node, data, smallImage = true) {
  if (smallImage) {
    this.data = data.images.fixed_height;
  } else {
    this.data = data.images.original;
  }
  node.querySelector('.gifPicture').style.backgroundImage = `url("${this.data.url}")`;
  if (smallImage) {
    node.querySelector('.gifPicture').addEventListener('click', (e) => {
      e.preventDefault();
      history.pushState({ model, view }, null, 'gif/' + data.id);
      OpenGif(data);
    });
  }
  node.querySelector('.gifPicture').style.width = `${this.data.width}px`;
  node.querySelector('.gifPicture').style.height = `${this.data.height}px`;
  return node;
}

function goBack() {
  history.back();
}

function enableButton() {
  if (document.getElementById('requestInput').value === '') {
    document.getElementById('requestBtn').setAttribute('disabled', 'disabled');
  } else { document.getElementById('requestBtn').removeAttribute('disabled'); }
}

document.getElementById('moreBtn').onclick = view.DisplayRequest.bind(view);

document.getElementById('backBtn').onclick = goBack;

document.getElementById('requestInput').oninput = enableButton;

document.getElementById('requestBtn').addEventListener('click', (e) => {
  e.preventDefault();
  model.request = document.getElementById('requestInput').value;
  history.pushState({ model, view }, null, '/search?q=' + model.request);
  model.currentGifs = [];
  view.RemoveGifs();
  view.DisplayRequest();
});

document.getElementById('requestInput').addEventListener('keyup', (e) => {
  e.preventDefault();
  if (e.keyCode === 13) document.getElementById('requestBtn').click();
});

function initialize(model, view) {
  const path = localStorage.getItem('path');
  if (path) {
    if (history.state) {
      [model, view] = [history.state.model, history.state.view];
    } else {
      model = new Model();
      view = new View(model);
    }
    localStorage.removeItem('path');
    if (path.slice(0, 6) === 'search') {
      history.pushState({ model, view }, null, path);
      document.getElementById('requestInput').value = path.slice(9);
      document.getElementById('requestInput').click();
    }
    if (path.slice(0, 3) === 'gif') {
      document.getElementById('requestInput').value = path.slice(5);
      const data = model.LoadById(path.slice(5));
      OpenGif(data);
    }
  } else {
    model = new Model();
    view = new View(model);
    history.pushState({ model, view }, null, '');
  }
}

let model;
let view;
initialize(model, view);
