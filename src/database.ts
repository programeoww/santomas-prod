import { DataTypes, ENUM, Sequelize } from "sequelize";
import bcrypt from 'bcryptjs';

DataTypes.DATE.prototype._stringify = function _stringify(date : any, options : any) {
    date = this._applyTimezone(date, options);
    return date.format('YYYY-MM-DD HH:mm:ss.SSS');
};

const database = new Sequelize(process.env.DB_DATABASE || 'santomas', process.env.DB_USERNAME || 'root', process.env.DB_PASSWORD || '', {
    host: 'localhost',
    dialect: 'mysql',
    port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 3306,
    logging: false,
    pool: {
        max: 5,
        min: 0,
        idle: 10000
    },
    timezone: '+07:00',
    dialectOptions:{
        dateStrings: true,
    },
});

database.authenticate().then(() => {
    console.log('Connection has been established successfully.');
 }).catch((error) => {
    console.error('Unable to connect to the database: ', error);
 });

 export const UserModel = database.define('user', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    password: DataTypes.STRING,
    role: {
        type: DataTypes.ENUM('admin', 'worker', 'manager', 'tivi'),
        defaultValue: 'worker'
    },
    username: {
        type: DataTypes.STRING,
        unique: true
    },
    name: DataTypes.STRING,
    note: {
        type: DataTypes.STRING,
    },
});

export const ProductModel = database.define('product', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    name: DataTypes.STRING,
    target: DataTypes.STRING,
    key_QR: DataTypes.STRING,
    pac: DataTypes.STRING,
    box: DataTypes.STRING,
    note: {
        type: DataTypes.STRING,
        // defaultValue: []
    },
});

export const AssemblyLineModel = database.define('assembly_line', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    name: DataTypes.STRING,
    shift: DataTypes.ENUM("MS", "NS", "AS", "ALL"),
    finish: DataTypes.INTEGER,
    status: DataTypes.ENUM("PENDING", "OFF", "CANCELED", "ON", "ARCHIVED"),
    endAt: DataTypes.DATE,
    managerId: DataTypes.INTEGER,
    productId: DataTypes.INTEGER,
    note: DataTypes.STRING,
});

bcrypt.hash('admin', 10).then((hash) => {
    UserModel.findOrCreate({
        where: {
            username: 'admin'
        },
        defaults: {
            name: 'admin',
            password: hash,
            role: 'admin'
        }
    }).catch((error) => {
        console.log(error);
    })
});

UserModel.hasMany(AssemblyLineModel, {
    foreignKey: 'managerId',
    as: 'assembly_lines'
});

AssemblyLineModel.belongsTo(UserModel, {
    foreignKey: 'managerId',
    as: 'manager'
});

AssemblyLineModel.belongsToMany(UserModel, {
    through: 'AssemblyLineWorker',
    foreignKey: 'assemblyLineId',
    otherKey: 'workerId',
    as: 'workers'
});

UserModel.belongsToMany(AssemblyLineModel, {
    through: 'AssemblyLineWorker',
    foreignKey: 'workerId',
    otherKey: 'assemblyLineId',
    as: 'assembly_line'
});

AssemblyLineModel.belongsTo(ProductModel, {
    foreignKey: 'productId',
    as: 'product'
});

ProductModel.hasMany(AssemblyLineModel, {
    foreignKey: 'productId',
    as: 'assembly_lines'
});

database.sync().then(() => {
console.log('All tables created successfully!');
}).catch((error) => {
console.error('Unable to create tables : ', error);
});

export default database;