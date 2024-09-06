const socket = io()

//elements
const $messageForm = document.querySelector('#message-form')
const $inputMessage = $messageForm.querySelector('input');
const $messageFormButton = $messageForm.querySelector('button')
const $sendLocationButton = document.querySelector('#send-location')
const $messages = document.querySelector('#messages')

//templates
const messageTemplate = document.querySelector('#message-template').innerHTML
const locationTemplate = document.querySelector('#location-template').innerHTML
const sideBarTemplate = document.querySelector('#sidebar-template').innerHTML

//options
const { username, room } = Qs.parse(location.search, { ignoreQueryPrefix: true })

const autoScroll = () => {
  // new msg element 
  const $newMessage = $messages.lastElementChild

  //get height of new message
  const newMsgStyles = getComputedStyle($newMessage)
  const newMsgMargin = parseInt(newMsgStyles.marginBottom)
  const newMsgHeight = $newMessage.offsetHeight + newMsgMargin

  //visible height
  const visibleHeight = $messages.offsetHeight

  //height of msgs container
  const contentHeight = $messages.scrollHeight

  // how far down we have scrolled, give us distance we have scrolled from top
  const scrollOffset = $messages.scrollTop + visibleHeight

  if(contentHeight - newMsgHeight <=scrollOffset){
    $messages.scrollTop = $messages.scrollHeight
  }

}

socket.on('message', (message) => {
  const html = Mustache.render(messageTemplate, { username: message.username, message: message.text, createdAt: moment(message.createdAt).format('h:mm a') });
  $messages.insertAdjacentHTML('beforeend', html)
  autoScroll()
})

socket.on('locationMessage', (locationData) => {
  const html = Mustache.render(locationTemplate, { username: locationData.username, location: locationData.location, createdAt: moment(locationData.creaatedAt).format('h:mm a') });
  $messages.insertAdjacentHTML('beforeend', html)
  autoScroll()
})

$messageForm.addEventListener('submit', (e) => {
  e.preventDefault();

  $messageFormButton.setAttribute('disabled', 'disabled');

  socket.emit('sendMessage', e.target.elements.message.value, (error) => {
    $messageFormButton.removeAttribute('disabled');
    $inputMessage.value = '';
    $inputMessage.focus();
    if (error) {
      return console.log(error)
    }
    console.log('Message delivered')
  })
})

$sendLocationButton.addEventListener('click', () => {
  if (!navigator.geolocation) {
    return alert('Geolocation is not supported by your browser')
  }
  $sendLocationButton.setAttribute('disabled', 'disabled')
  navigator.geolocation.getCurrentPosition((position) => {
    socket.emit('sendLocation', { latitude: position.coords.latitude, longitude: position.coords.longitude }, () => {
      $sendLocationButton.removeAttribute('disabled')

      console.log('Location delivered')
    })
  })
})

socket.emit('join', { username, room }, (error) => {
  if (error) {
    alert(error)
    location.href = '/'
  }
})

socket.on('roomData', ({ room, users }) => {
  const html = Mustache.render(sideBarTemplate, { room, users })
  document.querySelector('#sidebar').innerHTML = html
})