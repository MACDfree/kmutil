import global from '../utils/global'
import low from 'lowdb'
import FileSync from 'lowdb/adapters/FileSync'

export function initNew(cb) {
  let per = 10
  cb(per)
  const adapter = new FileSync(global().currentPath + '\\info.json')
  const db = low(adapter)
  per = 50
  cb(per)
  db.defaults({ directorys: [], tags: [], documents: [] }).write()
  per = 100
  cb(per)
}

// export function init(cb) {
//   let per = 0
//   const path = global().currentPath
//   if (!fs.existsSync(path + '\\attach')) {
//     // 创建文件夹
//     fs.mkdirSync(path + '\\attach')
//   }
//   per = 10
//   cb(per)
//   const dataBase = new DataBase()
//   dataBase.open().then(() => {
//     console.log('search directory table')
//     return dataBase.get('select COUNT(*) a from sqlite_master where type=\'table\' and UPPER(name) = UPPER(\'KM_directory\')')
//   }).then(row => {
//     per = 20
//     cb(per)
//     console.log('create directory table')
//     if (row.a === 0) {
//       // 执行建表语句
//       return dataBase.exec(directorySql)
//     } else {
//       return Promise.resolve()
//     }
//   }).then(() => {
//     console.log('search tag table')
//     return dataBase.get('select COUNT(*) a from sqlite_master where type=\'table\' and UPPER(name) = UPPER(\'KM_tag\')')
//   }).then(row => {
//     per = 30
//     cb(per)
//     console.log('create tag table')
//     if (row.a === 0) {
//       // 执行建表语句
//       return dataBase.exec(tagSql)
//     } else {
//       return Promise.resolve()
//     }
//   }).then(() => {
//     console.log('search doc table')
//     return dataBase.get('select COUNT(*) a from sqlite_master where type=\'table\' and UPPER(name) = UPPER(\'KM_document\')')
//   }).then(row => {
//     per = 40
//     cb(per)
//     console.log('create doc table')
//     if (row.a === 0) {
//       // 执行建表语句
//       return dataBase.exec(docSql)
//     } else {
//       return Promise.resolve()
//     }
//   }).then(() => {
//     console.log('search doctag table')
//     return dataBase.get('select COUNT(*) a from sqlite_master where type=\'table\' and UPPER(name) = UPPER(\'KM_Doc_Tag\')')
//   }).then(row => {
//     per = 50
//     cb(per)
//     console.log('create doctag table')
//     if (row.a === 0) {
//       // 执行建表语句
//       return dataBase.exec(docTagSql)
//     } else {
//       return Promise.resolve()
//     }
//   }).catch(err => {
//     console.log(err)
//   }).finally(() => {
//     dataBase.close()
//     per = 100
//     cb(per)
//   })
// }

// const directorySql = `PRAGMA foreign_keys = false;
// CREATE TABLE "KM_DIRECTORY" (
//   "ID" integer NOT NULL DEFAULT NULL PRIMARY KEY AUTOINCREMENT,
//   "CREATE_TIME" integer NOT NULL,
//   "UPDATE_TIME" integer NOT NULL,
//   "NAME" text NOT NULL,
//   "PARENT" integer NOT NULL DEFAULT ''
// );
// UPDATE "sqlite_sequence" SET seq = 12 WHERE name = 'KM_DIRECTORY';
// PRAGMA foreign_keys = true;`

// const tagSql = `PRAGMA foreign_keys = false;
// DROP TABLE IF EXISTS "KM_TAG";
// CREATE TABLE "KM_TAG" (
//   "ID" integer NOT NULL PRIMARY KEY AUTOINCREMENT,
//   "CREATE_TIME" integer NOT NULL,
//   "UPDATE_TIME" integer NOT NULL,
//   "NAME" TEXT NOT NULL
// );
// UPDATE "sqlite_sequence" SET seq = 7 WHERE name = 'KM_TAG';
// PRAGMA foreign_keys = true;`

// const docSql = `PRAGMA foreign_keys = false;
// DROP TABLE IF EXISTS "KM_DOCUMENT";
// CREATE TABLE "KM_DOCUMENT" (
//   "ID" integer NOT NULL PRIMARY KEY AUTOINCREMENT,
//   "CREATE_TIME" integer NOT NULL,
//   "UPDATE_TIME" integer NOT NULL,
//   "TITLE" TEXT NOT NULL,
//   "CONTENT" TEXT,
//   "TYPE" TEXT NOT NULL,
//   "DIRECTORY_ID" integer,
//   "PATH" TEXT
// );
// UPDATE "sqlite_sequence" SET seq = 12 WHERE name = 'KM_DOCUMENT';
// PRAGMA foreign_keys = true;`

// const docTagSql = `PRAGMA foreign_keys = false;
// DROP TABLE IF EXISTS "KM_DOC_TAG";
// CREATE TABLE "KM_DOC_TAG" (
//   "ID" integer NOT NULL PRIMARY KEY AUTOINCREMENT,
//   "DOC_ID" integer NOT NULL,
//   "TAG_ID" integer NOT NULL
// );
// UPDATE "sqlite_sequence" SET seq = 12 WHERE name = 'KM_DOC_TAG';
// PRAGMA foreign_keys = true;`
