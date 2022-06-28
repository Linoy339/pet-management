const { Db } = require('mongodb');
const server = require('./index');
const mongoose = require('mongoose');
const Model = require('./models/model');
const modelUser = mongoose.model('user');
const encodings = require('./node_modules/iconv-lite/encodings');                                                                                                                                                                       
const iconvLite = require('./node_modules/iconv-lite/lib');                                                                                                                                                                             
iconvLite.getCodec('UTF-8');
 
test("checking role of user", async () => {

  const result = await modelUser.findOne({}).where('role').equals(1);
  expect(result).not.toEqual(null);

});

//exports.result = result;

jest.clearAllTimers()
  



 
