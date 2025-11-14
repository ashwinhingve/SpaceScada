'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.Permission =
  exports.UserRole =
  exports.AggregationType =
  exports.EventType =
  exports.AlarmSeverity =
  exports.TagQuality =
  exports.DataType =
  exports.ProtocolType =
  exports.DeviceStatus =
  exports.DeviceType =
    void 0;
var DeviceType;
(function (DeviceType) {
  DeviceType['PLC'] = 'PLC';
  DeviceType['RTU'] = 'RTU';
  DeviceType['SENSOR'] = 'SENSOR';
  DeviceType['ACTUATOR'] = 'ACTUATOR';
  DeviceType['GATEWAY'] = 'GATEWAY';
})(DeviceType || (exports.DeviceType = DeviceType = {}));
var DeviceStatus;
(function (DeviceStatus) {
  DeviceStatus['ONLINE'] = 'ONLINE';
  DeviceStatus['OFFLINE'] = 'OFFLINE';
  DeviceStatus['ERROR'] = 'ERROR';
  DeviceStatus['MAINTENANCE'] = 'MAINTENANCE';
})(DeviceStatus || (exports.DeviceStatus = DeviceStatus = {}));
var ProtocolType;
(function (ProtocolType) {
  ProtocolType['MODBUS_TCP'] = 'MODBUS_TCP';
  ProtocolType['MODBUS_RTU'] = 'MODBUS_RTU';
  ProtocolType['OPC_UA'] = 'OPC_UA';
  ProtocolType['MQTT'] = 'MQTT';
  ProtocolType['SNMP'] = 'SNMP';
})(ProtocolType || (exports.ProtocolType = ProtocolType = {}));
var DataType;
(function (DataType) {
  DataType['BOOLEAN'] = 'BOOLEAN';
  DataType['INT16'] = 'INT16';
  DataType['INT32'] = 'INT32';
  DataType['FLOAT'] = 'FLOAT';
  DataType['DOUBLE'] = 'DOUBLE';
  DataType['STRING'] = 'STRING';
})(DataType || (exports.DataType = DataType = {}));
var TagQuality;
(function (TagQuality) {
  TagQuality['GOOD'] = 'GOOD';
  TagQuality['BAD'] = 'BAD';
  TagQuality['UNCERTAIN'] = 'UNCERTAIN';
})(TagQuality || (exports.TagQuality = TagQuality = {}));
var AlarmSeverity;
(function (AlarmSeverity) {
  AlarmSeverity['CRITICAL'] = 'CRITICAL';
  AlarmSeverity['HIGH'] = 'HIGH';
  AlarmSeverity['MEDIUM'] = 'MEDIUM';
  AlarmSeverity['LOW'] = 'LOW';
})(AlarmSeverity || (exports.AlarmSeverity = AlarmSeverity = {}));
// Real-time Event Types
var EventType;
(function (EventType) {
  EventType['TAG_UPDATE'] = 'TAG_UPDATE';
  EventType['DEVICE_STATUS'] = 'DEVICE_STATUS';
  EventType['ALARM_TRIGGERED'] = 'ALARM_TRIGGERED';
  EventType['ALARM_ACKNOWLEDGED'] = 'ALARM_ACKNOWLEDGED';
  EventType['CONNECTION_STATUS'] = 'CONNECTION_STATUS';
})(EventType || (exports.EventType = EventType = {}));
var AggregationType;
(function (AggregationType) {
  AggregationType['RAW'] = 'RAW';
  AggregationType['AVERAGE'] = 'AVERAGE';
  AggregationType['MIN'] = 'MIN';
  AggregationType['MAX'] = 'MAX';
  AggregationType['SUM'] = 'SUM';
})(AggregationType || (exports.AggregationType = AggregationType = {}));
var UserRole;
(function (UserRole) {
  UserRole['ADMIN'] = 'ADMIN';
  UserRole['OPERATOR'] = 'OPERATOR';
  UserRole['VIEWER'] = 'VIEWER';
  UserRole['ENGINEER'] = 'ENGINEER';
})(UserRole || (exports.UserRole = UserRole = {}));
var Permission;
(function (Permission) {
  Permission['READ_DEVICES'] = 'READ_DEVICES';
  Permission['WRITE_DEVICES'] = 'WRITE_DEVICES';
  Permission['READ_TAGS'] = 'READ_TAGS';
  Permission['WRITE_TAGS'] = 'WRITE_TAGS';
  Permission['ACKNOWLEDGE_ALARMS'] = 'ACKNOWLEDGE_ALARMS';
  Permission['MANAGE_USERS'] = 'MANAGE_USERS';
  Permission['SYSTEM_CONFIG'] = 'SYSTEM_CONFIG';
})(Permission || (exports.Permission = Permission = {}));
