const express = require('express')
const path = require('path')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const bcrypt = require('bcrypt')
const app = express()
app.use(express.json())
let db = null
const dbPath = path.join(__dirname, 'userData.db')

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('Server running at http://localhost:3000/')
    })
  } catch (e) {
    console.log(`DB Error: ${e.message}`)
    process.exit(1)
  }
}

initializeDBAndServer()

app.post('/register', async (request, response) => {
  const {username, name, password, gender, location} = request.body
  const hashPassword = await bcrypt.hash(password, 10)
  const selectUserQuery = `SELECT * FROM user WHERE username='${username}'`
  const dbUser = await db.get(selectUserQuery)
  if (dbUser === undefined) {
    let addUser = `INSERT INTO user (username, name, password, gender, location) VALUES ('${username}', '${name}', '${hashPassword}', '${gender}', '${location}')`
    if (password.length < 5) {
      response.status(400)
      response.send('Password is too short')
    } else {
      let newUserdetails = await db.run(addUser)
      response.status(200)
      response.send('User created successfully')
    }
  } else {
    response.status(400)
    response.send('User already exists')
  }
})

app.post('/login', async (request, response) => {
  const {username, password} = request.body
  const selectUserQuery = `SELECT * FROM user WHERE username='${username}'`
  const dbUser = await db.get(selectUserQuery)
  if (dbUser === undefined) {
    response.status(400)
    response.send('Invalid user')
  } else {
    const isPasswordMatch = await bcrypt.compare(password, dbUser.password)
    if (isPasswordMatch === true) {
      response.status(200)
      response.send('Login success!')
    } else {
      response.status(400)
      response.send('Invalid password')
    }
  }
})

app.put('/change-password', async (request, response) => {
  const {username, oldPassword, newPassword} = request.body
  const getUserQuery = `SELECT * FROM user WHERE username = '${username}'`
  const dbUser = await db.get(getUserQuery)
  if (dbUser === undefined) {
    console.log(dbUser)
    response.status(400)
    response.send('User not registered')
  } else {
    const isValidPassword = await bcrypt.compare(oldPassword, dbUser.password)
    if (isValidPassword === true) {
      const hashNewPassword = await bcrypt.hash(newPassword, 10)
      const lengthOfNewPassword = newPassword.length
      if (lengthOfNewPassword < 5) {
        response.status(400)
        response.send('Password is too short')
      } else {
        const updateNewPassword = `UPDATE user SET password = '${hashNewPassword}' WHERE username='${username}'`
        await db.run(updateNewPassword)
        response.status(200)
        response.send('Password updated')
      }
    } else {
      response.status(400)
      response.send('Invalid current password')
    }
  }
})

module.exports = app
