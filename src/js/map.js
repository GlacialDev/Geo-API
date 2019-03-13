ymaps.ready(init);
function init() {
  let map = new ymaps.Map('map',
    {
      center: [59.94, 30.32],
      zoom: 13,
      controls: ['searchControl']
    },
    {
      suppressObsoleteBrowserNotifier: true,
      yandexMapDisablePoiInteractivity: true,
      suppressMapOpenBlock: true
    }
  );
  let objectManager = new ymaps.ObjectManager({
    clusterize: true,
    geoObjectOpenBalloonOnClick: false,
    clusterOpenBalloonOnClick: true,
    clusterDisableClickZoom: true,
    clusterBalloonContentLayout: 'cluster#balloonCarousel',
  });

  map.geoObjects.add(objectManager);
  map.behaviors.disable(['dblClickZoom']);

  objectManager.objects.options.set('preset', 'islands#darkGreenDotIcon');
  objectManager.objects.events.add(['click'], openInput)
  objectManager.clusters.options.set('preset', 'islands#darkGreenClusterIcons');

  // служебные переменные, нужные для создания новых меток
  let coords = [];
  let address = ''
  let objId = 0;

  // если в localstorage сохранены какие-то данные о метках, поставленных ранее
  // пробегаем по массиву и проставляем эти метки на карте
  if (localStorage.placemarksStorage) {
    let placemarksStorage = JSON.parse(localStorage.placemarksStorage)
    for (objId; objId < placemarksStorage.length;) addPlacemark(placemarksStorage[objId]);
  }

  const inputBlock = document.querySelector('.map-input');
  const inputHeaderText = inputBlock.querySelector('.map-input__header-text');
  const inputFeedbackList = inputBlock.querySelector('.map-input__feedback-list');
  const inputFields = inputBlock.querySelectorAll('.map-input__input');
  const inputSubmitButton = inputBlock.querySelector('.map-input__button');
  const inputCloseButton = inputBlock.querySelector('.map-input__close');

  map.events.add('click', event => openInput(event))

  inputSubmitButton.addEventListener('click', () => {
    let inputName = inputFields[0].value;
    let inputPlace = inputFields[1].value;
    let inputFeedback = inputFields[2].value;
    let formattedTime = formatDate(new Date);

    placemarkDataObj = {
      coords: coords,
      address: address,
      objId: objId,
      feedback: {
        inputName: inputName,
        inputPlace: inputPlace,
        inputFeedback: inputFeedback,
        inputDate: formattedTime
      }
    }

    addPlacemark(placemarkDataObj);

    // в localstorage параметр в виде строки; он либо уже содержит данные, либо его нет
    // либо мы парсим строку, получая массив, либо создаем пустой массив
    let placemarksStorage = localStorage.placemarksStorage ? JSON.parse(localStorage.placemarksStorage) : [];
    // добавляем в этот массив данные о новой метке
    placemarksStorage.push(placemarkDataObj);
    // преобразуем полученный массив обратно в строку
    placemarksStorage = JSON.stringify(placemarksStorage);
    // задаем localstorage обновленный массив в качестве значения
    localStorage.placemarksStorage = placemarksStorage;

    inputBlock.style.display = 'none';
    for (let i = 0; i < inputFields.length; i++) {
      inputFields[i].value = '';
    }
  })

  inputCloseButton.addEventListener('click', () => inputBlock.style.display = 'none')

  document.addEventListener('click', event => {
    if (event.target.classList.contains('baloon__link-btn')) {
      event.preventDefault();
      openInput(event);
    }
  })

  function getClickLocation(coords) {
    return new Promise((resolve, reject) => {
      ymaps.geocode(coords).then(res => {
        let geoObject = res.geoObjects.get(0);
        let clickLocation = geoObject.getAddressLine();
        resolve(clickLocation)
      })
    })
  }

  function addPlacemark(options) {
    let featuresObj = {
      "type": "Feature",
      "id": options.objId,
      "geometry": {
        "type": "Point",
        "coordinates": options.coords
      },
      "properties": {
        "balloonContentHeader": `<b>${options.feedback.inputPlace}</b>`,
        "balloonContentBody": `<a class="baloon__link-btn">${options.address}</a><br><br><p>${options.feedback.inputFeedback}</p>`,
        "balloonContentFooter": `${options.feedback.inputDate}`,
      }
    };

    objectManager.add({
      "type": "FeatureCollection",
      "features": [featuresObj]
    });

    objId++;
  }

  function openInput(event) {
    inputFeedbackList.innerHTML = 'Пока отзывов нету';

    // если у события есть таргет, значит была нажата ссылка
    if (typeof event.target !== 'undefined') {
      address = event.target.innerText;
      let placemarksStorage = JSON.parse(localStorage.placemarksStorage);

      inputFeedbackList.innerHTML = '';
      for (let i = 0; i < placemarksStorage.length; i++) {
        if (placemarksStorage[i].address === address) {
          coords = placemarksStorage[i].coords;
          inputHeaderText.innerText = placemarksStorage[i].address;
          let feedbackItem = formFeedbackItem(placemarksStorage[i]);
          inputFeedbackList.appendChild(feedbackItem);
        }
      }

      document.querySelector(".ymaps-2-1-73-balloon__close").dispatchEvent(new Event('click'))

      inputBlock.style.left = `${event.clientX}px`;
      inputBlock.style.top = `${event.clientY}px`;
      inputBlock.style.display = 'flex';

      return;
    }

    let inputPositionX = `${event.getSourceEvent().originalEvent.domEvent.originalEvent.clientX}px`;
    let inputPositionY = `${event.getSourceEvent().originalEvent.domEvent.originalEvent.clientY}px`;

    // если кликаем в то же место, где только что открыли попап - закрываем его
    if (inputPositionX === inputBlock.style.left && inputPositionY === inputBlock.style.top && inputBlock.style.display !== 'none') {
      inputBlock.style.display = 'none';
      return
    }
    // если был совершен клик на метку, objectId !== undefined
    // если же клик был просто по карте и coords !== undefined, то обрабатывается по другому
    if (event.get('objectId') >= 0) {
      inputFeedbackList.innerHTML = '';

      let objId = event.get('objectId');
      let placemarksStorage = JSON.parse(localStorage.placemarksStorage);
      for (let i = 0; i < placemarksStorage.length; i++) {
        if (placemarksStorage[i].objId === objId) {
          coords = placemarksStorage[i].coords;
          inputHeaderText.innerText = placemarksStorage[i].address;
          let feedbackItem = formFeedbackItem(placemarksStorage[i]);
          inputFeedbackList.appendChild(feedbackItem);
        }
      }

      inputBlock.style.left = inputPositionX;
      inputBlock.style.top = inputPositionY;
      inputBlock.style.display = 'flex';
    } else {
      coords = event.get('coords');

      // закрываем попап со старыми отзывами и адресом в заголовке
      // позже покажем попап уже с новым адресом/отзывами
      inputBlock.style.display = 'none';

      inputBlock.style.left = inputPositionX;
      inputBlock.style.top = inputPositionY;
      getClickLocation(coords)
        .then(result => {
          address = result;
          inputHeaderText.innerText = address
        })
        .then(() => {
          for (let i = 0; i < inputFields.length; i++) {
            inputFields[i].value = '';
          }
          inputFeedbackList.innerHTML = 'Пока отзывов нету';
          inputBlock.style.display = 'flex';
        })
    }
  }

  function formatDate(date) {

    let dd = date.getDate();
    if (dd < 10) dd = '0' + dd;

    let mm = date.getMonth() + 1;
    if (mm < 10) mm = '0' + mm;

    let yy = date.getFullYear() % 100;
    if (yy < 10) yy = '0' + yy;

    return dd + '.' + mm + '.' + yy;
  }

  function formFeedbackItem(placemarkDataObj) {
    let item = document.createElement('li');
    item.classList.add('map-input__feedback-item');
    item.innerHTML = `
    <div class="map-input__feedback-text">
      <div class="map-input__feedback-name">${placemarkDataObj.feedback.inputName}</div>
      <div class="map-input__feedback-place">${placemarkDataObj.feedback.inputPlace}</div>
      <div class="map-input__feedback-date">${placemarkDataObj.feedback.inputDate}</div>
    </div>
    <div class="map-input__feedback-text">${placemarkDataObj.feedback.inputFeedback}</div>`

    return item;
  }
}
