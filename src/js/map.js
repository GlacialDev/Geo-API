ymaps.ready(init);
function init() {
  let map = new ymaps.Map('map', {
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
  map.behaviors.disable(['dblClickZoom']);

  let coords = [];
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

    addPlacemark(map, coords);

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

function addPlacemark(map, coords) {
  let placemark = new ymaps.Placemark(coords);
  map.geoObjects.add(placemark);
}
