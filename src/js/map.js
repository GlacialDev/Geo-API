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
    }),
    objectManager = new ymaps.ObjectManager({
      clusterize: true,
      geoObjectOpenBalloonOnClick: true,
      clusterOpenBalloonOnClick: true,
      clusterDisableClickZoom: true,
      clusterBalloonContentLayout: 'cluster#balloonCarousel',
    });

  map.behaviors.disable(['dblClickZoom']);
  map.geoObjects.add(objectManager);

  objectManager.objects.options.set('preset', 'islands#darkGreenDotIcon');
  objectManager.clusters.options.set('preset', 'islands#darkGreenClusterIcons');
  objectManager.objects.events.add(['click'], getPlacemarkFeedbacks);

  let coords = [];
  let objId = 0;

  // если в localstorage сохранены какие-то данные о метках, поставленных ранее
  // пробегаем по массиву и проставляем эти метки на карте
  if (localStorage.placemarksStorage) {
    let placemarksStorage = JSON.parse(localStorage.placemarksStorage)
    for (objId; objId < placemarksStorage.length; objId++) {
      addPlacemark(objectManager, placemarksStorage[objId]);
    }
  }

  const inputBlock = document.querySelector('.map-input');
  const inputHeaderText = inputBlock.querySelector('.map-input__header-text');
  const inputFields = inputBlock.querySelectorAll('.map-input__input');
  const inputSubmitButton = inputBlock.querySelector('.map-input__button');

  map.events.add('click', event => {
    coords = event.get('coords');

    let inputPositionX = `${event.getSourceEvent().originalEvent.domEvent.originalEvent.clientX}px`
    let inputPositionY = `${event.getSourceEvent().originalEvent.domEvent.originalEvent.clientY}px`

    // если кликаем в то же место, где только что открыли попап - закрываем его
    if (inputPositionX === inputBlock.style.left && inputPositionY === inputBlock.style.top && inputBlock.style.display !== 'none') {
      inputBlock.style.display = 'none';
      return
    }

    // закрываем попап со старым адресом в заголовке
    // позже покажем попап уже с новым адресом
    inputBlock.style.display = 'none';

    inputBlock.style.left = inputPositionX;
    inputBlock.style.top = inputPositionY;
    getClickLocation(coords)
      .then(address => inputHeaderText.innerText = address)
      .then(() => {
        for (let i = 0; i < inputFields.length; i++) {
          inputFields[i].value = '';
        }
        inputBlock.style.display = 'flex';
      })
  })


  inputSubmitButton.addEventListener('click', () => {
    const inputName = inputFields[0].value;
    const inputPlace = inputFields[1].value;
    const inputFeedback = inputFields[2].value;

    placemarkStorageObj = {
      coords: coords,
      objId: objId,
      feedback: {
        inputName: inputName,
        inputPlace: inputPlace,
        inputFeedback: inputFeedback
      }
    }

    addPlacemark(objectManager, placemarkStorageObj);
    ++objId;

    // в localstorage параметр в виде строки; он либо уже содержит данные, либо его нет
    // либо мы парсим строку, получая массив, либо создаем пустой массив
    let placemarksStorage = localStorage.placemarksStorage ? JSON.parse(localStorage.placemarksStorage) : [];
    // добавляем в этот массив данные о новой метке
    placemarksStorage.push(placemarkStorageObj);
    // преобразуем полученный массив обратно в строку
    placemarksStorage = JSON.stringify(placemarksStorage);
    // задаем localstorage обновленный массив в качестве значения
    localStorage.placemarksStorage = placemarksStorage;

    inputBlock.style.display = 'none';
    for (let i = 0; i < inputFields.length; i++) {
      inputFields[i].value = '';
    }
  })

}

function getClickLocation(coords) {
  return new Promise((resolve, reject) => {
    ymaps.geocode(coords).then(res => {
      let geoObject = res.geoObjects.get(0);
      let clickLocation = geoObject.getAddressLine();
      resolve(clickLocation)
    })
  })
}

function addPlacemark(objectManager, options) {
  // let placemark = new ymaps.Placemark(coords);
  // map.geoObjects.add(placemark);
  let featuresObj = { "type": "Feature", "id": options.objId, "geometry": { "type": "Point", "coordinates": options.coords }, "properties": { "balloonContentHeader": `<font size=3><b>${options.feedback.inputName} ${options.feedback.inputPlace}</b></font>`, "balloonContentBody": `<p>${options.feedback.inputFeedback}</p>`, "balloonContentFooter": `${new Date}`, "clusterCaption": "<strong><s>Еще</s> одна</strong> метка", "hintContent": "<strong>Текст  <s>подсказки</s></strong>" } };

  objectManager.add({
    "type": "FeatureCollection",
    "features": [featuresObj]
  });
}

function getPlacemarkFeedbacks(e) {
  let objectId = e.get('objectId');
  console.log(objectId)
}