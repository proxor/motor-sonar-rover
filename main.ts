/*
    Sonja Duck Roboter

    1. Microbit
    2. Freenove Extension Board
    3. Power Bank
    4. Motor Driver
    
    GND Motor -- GND Board
    VCC Motor -- VCC 5V Board
    VCC Motor Driver -- VCC 3V Board
    GND Motor Driver -- GND Board
    IN1 -- P12
    IN2 -- P13
    IN3 -- P15
    IN4 -- P16

    Sonar Servo VCC -- VCC Board 5V (I2C)
    Sonar Servo GND -- GND Board (I2C)
    Sonar Servo PWM -- Pin 19 (SCL I2C)

    Sonar VCC -- VCC 5V Board
    Sonar GND -- GND Board
    Sonar Trig -- P1
    Sonar Echo -- P2

    Right Motor Red -- Motor Driver Step Motor 2
    Right Motor Black -- Motor Driver Step Motor 3
    Left Motor Red -- Motor Driver Step Motor 4
    Left Motor Black -- Motor Driver Step Motor 5

    Commands

    fb -2 0 2
    lr -2 0 2
    sn 0 1 2

*/

input.onButtonPressed(Button.A, function () {
    leftSpeed = 511
    rightSpeed = 511
    /*
    pins.digitalWritePin(DigitalPin.P16, 1)
    pins.digitalWritePin(DigitalPin.P15, 0)
    pins.digitalWritePin(DigitalPin.P12, 1)
    pins.digitalWritePin(DigitalPin.P13, 0)
    */
    //pins.servoWritePin(AnalogPin.P19, 0)
    sonarOn = false
})
input.onButtonPressed(Button.AB, function () {
    leftSpeed = 0
    rightSpeed = 0
/*
    pins.digitalWritePin(DigitalPin.P16, 0)
    pins.digitalWritePin(DigitalPin.P15, 0)
    pins.digitalWritePin(DigitalPin.P12, 0)
    pins.digitalWritePin(DigitalPin.P13, 0)
    */
    //pins.servoWritePin(AnalogPin.P19, 90)
    sonarOn = !sonarOn 
})
input.onButtonPressed(Button.B, function () {
    leftSpeed = -511
    rightSpeed = -511
    /*
    pins.digitalWritePin(DigitalPin.P16, 0)
    pins.digitalWritePin(DigitalPin.P15, 1)
    pins.digitalWritePin(DigitalPin.P12, 0)
    pins.digitalWritePin(DigitalPin.P13, 1)
    //pins.servoWritePin(AnalogPin.P19, 180)
    sonarOn = false*/
})
radio.setFrequencyBand(1)
radio.setGroup(1)
let sonarOn = false
let directDistance = 0
let sonarMinAng = 0
let sonarMaxAng = 180
basic.forever(function () {
    let dist = 0
    if (sonarOn) {
        for (let a = 45 + sonarMinAng; a <= 45+sonarMaxAng; a++) {
            pins.servoWritePin(AnalogPin.P19, 180 / 270 * a)
            dist = sonar.ping(DigitalPin.P1, DigitalPin.P2, PingUnit.Centimeters)
            dist = (dist == 0) ? 500 : dist
            directDistance = dist
            radio.sendValue("r" + (a - 45).toString(), dist)
            serial.writeString("r" + (a - 45).toString() + "-" + dist.toString())
            pause(20)
        }
        for (let a = 45 + sonarMaxAng; a >= 45 + sonarMinAng; a--) {
            pins.servoWritePin(AnalogPin.P19, 180 / 270 * a)
            dist = sonar.ping(DigitalPin.P1, DigitalPin.P2, PingUnit.Centimeters)
            dist = (dist == 0) ? 500 : dist
            directDistance = dist
            radio.sendValue("r" + (a - 45).toString(), dist)
            serial.writeString("r" + (a - 45).toString() + "-" + dist.toString())
            pause(20)
        }
    }

})

let leftSpeed = 0, rightSpeed = 0
basic.forever(()=>{
    leftSpeed = Math.max(-1023, Math.min(leftSpeed, 1023))
    rightSpeed = Math.max(-1023, Math.min(rightSpeed, 1023))

    if (leftSpeed > 0) {
        pins.digitalWritePin(DigitalPin.P16, leftSpeed)
        pins.digitalWritePin(DigitalPin.P15, 0)
    }
    else {
        pins.digitalWritePin(DigitalPin.P16, 0)
        pins.digitalWritePin(DigitalPin.P15, -leftSpeed)
    }
    if (rightSpeed > 0) {
        pins.digitalWritePin(DigitalPin.P12, rightSpeed)
        pins.digitalWritePin(DigitalPin.P13, 0)
    }
    else {
        pins.digitalWritePin(DigitalPin.P12, 0)
        pins.digitalWritePin(DigitalPin.P13, -rightSpeed)
    }
    //pause(20)
})

radio.onReceivedValue((name, value) => {
    switch(name) {
        case "fb":
            switch(value) {
                case -2:
                    leftSpeed = -512
                    rightSpeed = -512
                    break
                case 0:
                    leftSpeed = 0
                    rightSpeed = 0
                    break
                case 2:
                    leftSpeed = 1023
                    rightSpeed = 1023
                    break
            }
        break
        case "lr":
            switch (value) {
                case 2:
                    leftSpeed = 63
                    rightSpeed = -63
                    break
                case 0:
                    leftSpeed = 0
                    rightSpeed = 0
                    break
                case -2:
                    leftSpeed = -63
                    rightSpeed = 63
                    break
            }
            break
        case "sn":
            switch(value) {
                case 2:
                    sonarFolowOn(80)
                break
                case 1:
                    sonarFolowOn(90)
                    break
                case 0:
                    sonarFolowOff()
                break
            }
    }
})


basic.forever(()=> {
    if (Math.abs(input.rotation(Rotation.Roll)) > 20)
        sonarFolowOff()
    if (Math.abs(input.rotation(Rotation.Pitch)) > 20)
        sonarFolowOff()
})

let sonarFolow = false
let goalDistance = 10
let goalHist = 0.2
function sonarFolowOn(angle: number) {
    sonarOn = true
    sonarFolow = true
    sonarMinAng = angle - 10
    sonarMaxAng = angle + 10
    basic.forever(()=> {
        while(sonarFolow) {
            let speed = (directDistance - goalDistance) * 512
            if (Math.abs(directDistance - goalDistance) < goalDistance*goalHist) {
                sonarFolowOff()
                speed = 0
            }
            leftSpeed = speed
            rightSpeed = speed
            pause(20)
        }
    })
}

function sonarFolowOff() {
    sonarFolow = false
    leftSpeed = 0
    rightSpeed = 0
    sonarMinAng = 0
    sonarMaxAng = 180
}