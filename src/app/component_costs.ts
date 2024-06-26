export const components = [
    {
        name: "Gyro",
        dictName: "gyro",
        defaultName: "gyro",
        cost: 100
    },
    {
        name: "InertialUnit",
        dictName: "iu",
        defaultName: "inertial_unit",
        cost: 100
    },
    {
        name: "GPS",
        dictName: "gps",
        defaultName: "gps",
        cost: 250
    },
    {
        name: "Camera",
        dictName: "camera1",
        defaultName: "camera1",
        cost: 500
    },
    {
        name: "Camera",
        dictName: "camera2",
        defaultName: "camera2",
        cost: 500
    },
    {
        name: "Camera",
        dictName: "camera3",
        defaultName: "camera3",
        cost: 500
    },
    {
        name: "Colour sensor",
        dictName: "colsensor",
        defaultName: "colour_sensor",
        cost: 100
    },
    {
        name: "Accelerometer",
        dictName: "acc",
        defaultName: "accelerometer",
        cost: 100
    },
    {
        name: "Lidar",
        dictName: "lidar",
        defaultName: "lidar",
        cost: 500
    }
]

export const dims = new Map<number, number>([
    [32, 0],
    [40, 0],
    [64, 100],
    [128, 200],
    [256, 300],
]);
