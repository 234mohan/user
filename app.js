const express = require('express')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const path = require('path')
const dbPath = path.join(__dirname, 'userData.db')
const app = express()
const bcrypt = require('bcrypt')

app.use(express.json())

let db = null

const initializationDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('Server is Running At http://localhost:3000')
    })
  } catch (e) {
    console.log(`DB Error ${e.message}`)
    process.exit(1)
  }
}

initializationDBAndServer()

const isValidPassword = password => {
  return password > 4
}

app.post('/register', async (request, response) => {
  const {username, name, password, gender, location} = request.body
  const hashedpassword = await bcrypt.hash(password, 10)
  const selectedExistedUser = `SELECT * FROM user WHERE username='${username}'`
  const result = await db.get(selectedExistedUser)
  if (result === undefined) {
    const sqlQuery = `
        INSERT INTO user(username, name, password, gender, location)
        VALUES (
            '${username}',
            '${name}',
            '${hashedpassword}',
            '${gender}',
            '${location}',
        )`
    if (isValidPassword(password) === true) {
      await db.run(sqlQuery)
      response.send('User created successfully')
    } else {
      response.status(400)
      response.send('Password is too short')
    }
  } else {
    response.status(400)
    response.send('User already exists')
  }
})

app.post('/login', async (request, response) => {
  const {username, password} = request.body
  const sqlQuery = `SELECT * FROM user WHERE username=${username}`
  const selectedExisted = await db.get(sqlQuery)
  if (selectedExisted === undefined) {
    response.status(400)
    response.send('Invalid user')
  } else {
    const compared = await bcrypt.compare(password, selectedExisted.password)
    if (compared === true) {
      response.status(200)
      response.send('Login Success!')
    } else {
      response.status(400)
      response.send('Invalid Password')
    }
  }
})

app.put('/change-password', async (request, response) => {
  const {username, oldPassword, newPassword} = request.body
  const alreadyExist = `SELECT * FROM user WHERE username='${username}'`
  const newResult = await db.get(alreadyExist)
  if (newResult === undefined) {
    response.status(200)
    response.send('Invalid User')
  } else {
    const compared = await bcrypt.compare(oldPassword, newResult.password)
    if (compared === true) {
      if (isValidPassword(newPassword)) {
        const hashedpassword2 = await bcrypt.hash(newPassword, 10)
        const newPasswordOfUser = `
              UPDATE user 
              SET password='${hashedpassword2}' 
              WHERE username='${username}'`
        await db.run(newPasswordOfUser)
        response.status(200)
        response.send('Password updated')
      } else {
        response.status(400)
        response.send('Password is too short')
      }
    } else {
      response.status(400)
      response.send('Invalid current password')
    }
  }
})

module.exports = app
