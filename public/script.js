let currentMode = ''

async function onPageLoad() {
  // Set up the default behavior for some DOM elements
  getDarkModePreference()
  selectCourses()
}

async function selectCourses() {
  // Get courses from db and create options for them
  let courseOptions = await requestCourses()
  console.log('Courses: ' + courseOptions)
  let dropdown = document.getElementById('course')
  for (let option of courseOptions) {
    let newOption = document.createElement('option')
    newOption.value = option.id
    newOption.textContent = option.display
    dropdown.appendChild(newOption)
  }
}

async function requestCourses() {
  // Request courses from DB
  let url = 'http://localhost:3000/api/v1/courses'
  const courses = await fetch(url, { method: 'GET' })
  return courses.json()
}

document.getElementById('course').addEventListener('change', (ev) => {
  // Shows the uvuId text entry if a course is selected and hides it if none is selected.
  let div = document.getElementById('idDiv')

  if (ev.target.value === '') {
    //Default value is selected
    div.classList.add('hidden')
  } else {
    div.classList.remove('hidden')
  }
})

document.getElementById('uvuId').addEventListener('input', (ev) => {
  // Checks id to make sure it doesn't exceed 8 chars, is only digits, and fires off an ajax call if 8 valid characters are sent back.
  let warningMessage = document.getElementById('idWarning')
  let uvuId = ev.target.value
  if (uvuId.length > 8) {
    warningMessage.classList.remove('hidden')
    warningMessage.innerText = 'Your id should only be 8 digits long'
    ev.target.value = uvuId.slice(0, 8)
  } else if (uvuId.length < 8) {
    let re = /^\d*$/
    if (re.test(uvuId)) {
      //All is good. Continue
    } else {
      warningMessage.classList.remove('hidden')
      warningMessage.innerText = 'Your id can only consist of digits'
    }
  } else {
    let re = /^\d\d\d\d\d\d\d\d$/gm
    if (re.test(uvuId)) {
      console.log('ajax call')
      requestLogs()
    } else {
      warningMessage.classList.remove('hidden')
      warningMessage.innerText = 'Your id should consist of 8 digits'
    }
  }
})

function addLog(container, log) {
  // Helper function to add a json log to the list of logs on the page
  let logElem = document.createElement('li')
  logElem.classList.add('clickToHide')
  logElem.innerHTML = `<div><small>${log.date}</small></div><pre><p>${log.text}</p></pre>`
  container.appendChild(logElem)
}

async function requestLogs() {
  // Requests the log data from the server
  var request = new XMLHttpRequest()
  var requestURL = `http://localhost:3000/logs?courseId=${
    document.getElementById('course').value
  }&uvuId=${document.getElementById('uvuId').value}`
  request.onreadystatechange = function () {
    let logContainer = document.querySelector('#logDiv > ul')
    if (this.status == 200 || this.status == 304) {
      if (this.responseText === '' || this.responseText === '[]') {
        logContainer.innerHTML = `<p>No data found</p>`
      } else {
        logContainer.innerHTML = ''
        console.log(this.responseText)
        for (let log of JSON.parse(this.responseText)) {
          addLog(logContainer, log)
        }
        document.querySelectorAll('.clickToHide').forEach((toggleHide) => {
          toggleHide.addEventListener('click', (ev) => {
            let logText = toggleHide.querySelector('p')
            if (logText.classList.contains('hidden')) {
              logText.classList.remove('hidden')
            } else {
              logText.classList.add('hidden')
            }
          })
        })
        document.getElementById('uvuIdDisplay').innerHTML = `Student Logs for ${
          document.getElementById('uvuId').value
        }`
        document.querySelector('form button').disabled = false
      }
    } else {
      logContainer.innerHTML = `<p class="warning">Something went wrong. Please try again</p>`
      //error message
    }
  }
  request.open('GET', requestURL, true)
  request.send()
}

document.getElementById('logForm').addEventListener('submit', async (ev) => {
  // Submit handler. Creates object from the form data, submits to the db and then displays the data.
  ev.preventDefault()
  ev.stopPropagation()
  const self = this
  let submitDate = new Date().toLocaleString()
  submitDate = submitDate.replace(',', '')
  let newLog = {
    courseId: ev.target[0].value,
    uvuId: ev.target[1].value,
    date: submitDate,
    text: ev.target[2].value,
    id: createUUID(),
  }
  let url = 'http://localhost:3000/logs'
  const addLog = await fetch(url, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(newLog),
  }).then(self.requestLogs())
})

function createUUID() {
  // Create a unique ID for each new log
  return 'xxxxxxx'.replace(/[xy]/g, function (c) {
    var r = (Math.random() * 16) | 0,
      v = c == 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

function getDarkModePreference() {
  //check for localStorage
  let darkPreferred = localStorage.getItem('darkMode')
  if (darkPreferred === null) {
    // Should be the last case:  localStorage.setItem('darkMode', false)
    console.log('User Pref: unknown')
    //check for browser preference
    //There isn't a way to get OS and Browser preferences separately
    if (
      window.matchMedia &&
      window.matchMedia('(prefers-color-scheme: dark)').matches
    ) {
      console.log('Browser Pref: dark')
      localStorage.setItem('darkMode', 'dark')
      currentMode = 'dark'
    } else if (
      window.matchMedia &&
      window.matchMedia('(prefers-color-scheme: light)').matches
    ) {
      console.log('Browser Pref: light')
      localStorage.setItem('darkMode', 'light')
      currentMode = 'light'
    } else {
      //set to light if no browse preference
      console.log('Preference Unknown. Preference set to light by default.')
      localStorage.setItem('darkMode', 'light')
      currentMode = 'light'
    }
  } else if (darkPreferred === 'dark') {
    console.log('User Pref: dark')
    currentMode = 'dark'
  } else if (darkPreferred === 'light') {
    console.log('User Pref: light')
    currentMode = 'light'
  } else {
    console.log('Oops, unexpected value in localStorage!')
  }

  if (currentMode === 'dark') {
    document.body.classList.add('darkMode')
  } else if (currentMode === 'light') {
    document.body.classList.remove('darkMode')
  } else {
    console.log(`This isn't dark or light... this shouldn't be happening...`)
  }
}

document.querySelector('#themeButton').addEventListener('click', function () {
  if (currentMode === 'dark') {
    document.body.classList.remove('darkMode')
    localStorage.setItem('darkMode', 'light')
    currentMode = 'light'
  } else if (currentMode === 'light') {
    document.body.classList.add('darkMode')
    localStorage.setItem('darkMode', 'dark')
    currentMode = 'dark'
  } else {
    console.log(`This isn't dark or light... this shouldn't be happening...`)
  }
})

function switchTheme() {
  if (currentMode === 'dark') {
    document.body.classList.remove('darkMode')
    localStorage.setItem('darkMode', 'light')
  } else if (currentMode === 'light') {
    document.body.classList.add('darkMode')
    localStorage.setItem('darkMode', 'dark')
  } else {
    console.log(`This isn't dark or light... this shouldn't be happening...`)
  }
}
