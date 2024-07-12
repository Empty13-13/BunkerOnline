const bcrypt = require('bcrypt')
const uuid = require('uuid')
const mailService = require('./mail-service')
const UserModel = require('../model/models')
const tokenService = require('./token-service')
const UserDto = require('../dtos/user-dto')
const UserDtoDiscord = require('../dtos/user-dtoDiscord')
const ApiError = require('../exceptions/api-error')
const axios = require('axios')
const fs = require('fs')
require('dotenv').config()
const path = require('path')
const {Op} = require('sequelize')
const playerDataService = require('../service/playerData-service')
const {User} = require("../model/models");


class ioHostRevFunc {

  async professionExpRev(playersId, lastVar, gameRoomId, idRoom, io) {
    let emitData = {players: {}, logsData: {}}
    let players = await UserModel.RoomSession.findAll({where: {gameRoomId: gameRoomId, userId: playersId}})
    for (let player of players) {
      let data = JSON.parse(player.profession)
      let exp = lastVar[player.userId]
      let ecsExp = data.text.substring(data.text.indexOf('(') + 1, data.text.indexOf(')'))
      data.text = data.text.replace(ecsExp, exp)
      let isOpen = data.isOpen
      player.profession = JSON.stringify(data)
      data = {profession: data}
      await player.save()
      console.log(data)
      if (isOpen) {
        console.log("player.userId", player.userId)
        emitData.players[player.userId] = data
      }
      else {
        io.to(`user:${player.userId}:${idRoom}`).emit('setAllGameData', {players: {[player.userId]: data}})
      }
    }
    return emitData

  }

  async degreeOfSickRev(playersId, lastVar, gameRoomId, idRoom, io) {
    let emitData = {players: {}, logsData: {}}
    let players = await UserModel.RoomSession.findAll({where: {gameRoomId: gameRoomId, userId: playersId}})
    for (let player of players) {
      let data = JSON.parse(player.health)
      let exp = lastVar[player.userId]
      let ecsExp = data.text.substring(data.text.indexOf('(') + 1, data.text.indexOf(')'))
      data.text = data.text.replace(ecsExp, exp)
      let isOpen = data.isOpen
      player.health = JSON.stringify(data)
      data = {health: data}
      await player.save()
      // console.log(data)
    //  console.log(isOpen)
      if (isOpen) {
       // console.log("player.userId123", player.userId)
        //console.log('DATA',data)
        emitData.players[player.userId] = data
       // console.log('INOPEN', emitData)
      }
      else {
        io.to(`user:${player.userId}:${idRoom}`).emit('setAllGameData', {players: {[player.userId]: data}})
      }
    }
    //console.log('FUNC', emitData)
    return emitData


  }

  async sexOppositeRev(playersId, lastVar, gameRoomId, idRoom, io) {
    let emitData = {players: {}, logsData: {}}
    let players = await UserModel.RoomSession.findAll({where: {gameRoomId: gameRoomId, userId: playersId}})
    for (let player of players) {
      let data = JSON.parse(player.sex)
      data.text =lastVar[player.userId]
      console.log(data)
      let isOpen = data.isOpen
      player.sex = JSON.stringify(data)
      data = {sex: data}
      console.log(player.sex)
      await player.save()
      console.log(data)
      if (isOpen) {
        console.log("player.userId", player.userId)
        emitData.players[player.userId] = data
      }
      else {
        io.to(`user:${player.userId}:${idRoom}`).emit('setAllGameData', {players: {[player.userId]: data}})
      }
    }
    io.in([idRoom, `watchers:${idRoom}`]).emit('setAllGameData', emitData)
    console.log(emitData)
    return emitData

  }

  async cureMakeRev(playersId, lastVar, gameRoomId, idRoom, io) {
    let emitData = {players: {}, logsData: {}}
    let players = await UserModel.RoomSession.findAll({where: {gameRoomId: gameRoomId, userId: playersId}})
    for (let player of players) {
      //console.log(lastVar[player.userId])
      let openData = {}
      let closeData = {}
      for (let key in lastVar[player.userId]) {
        let data = JSON.parse(player[key])
        // console.log(data)
        let isOpen = data.isOpen
        data = lastVar[player.userId][key]
        data.isOpen = isOpen
        player[key] = JSON.stringify(data)
        //  console.log(data)sss
        if (isOpen) {
          openData[key] = data
        }
        else {
          closeData[key] = data
        }
        console.log(openData)
      }
      await player.save()
      emitData.players[player.userId] = openData
      io.to(`user:${player.userId}:${idRoom}`).emit('setAllGameData', {players: {[player.userId]: closeData}})
    }
    return emitData

  }

  async exchangeChartRev(playersId, lastVar, gameRoomId, idRoom, io, chartName,bunkerItems) {
    let emitData = {players: {}, logsData: {}}
    let players = await UserModel.RoomSession.findAll({where: {gameRoomId: gameRoomId, userId: playersId}})

    for (let player of players) {
      //console.log(lastVar[player.userId])
      let openData = {}
      let closeData = {}
      let data = JSON.parse(player[chartName])
      let isOpen = data.isOpen
      data = lastVar[player.userId]
      data.isOpen = isOpen
      player[chartName] = JSON.stringify(data)
      //  console.log(data)ssss160ы
      if (isOpen) {
        openData[chartName] = data
      }
      else {
        closeData[chartName] = data
      }
      console.log(openData)

      await player.save()
      emitData.players[player.userId] = openData
      io.to(`user:${player.userId}:${idRoom}`).emit('setAllGameData', {players: {[player.userId]: closeData}})
    }
    if(bunkerItems.length>0){
      emitData.bunkerData= {bunkerItems:bunkerItems}

    }
    return emitData

  }


}

module
  .exports = new ioHostRevFunc()