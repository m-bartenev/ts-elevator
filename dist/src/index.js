/*

Create:

Elevator Class : interface graphic entity

Queue/Floor Class : interface graphic entity

Passenger Class / Interface : interface graphic entity

Elevator controller

*/
class HTMLRepresentable {
    set HTML(HTML) {
        this._HTML = HTML;
    }
    get HTML() {
        return this._HTML;
    }
}
class Floor extends HTMLRepresentable {
    constructor(number, maxFloor) {
        super();
        this.queue = [];
        this.stopQueueFlag = false;
        this.selectorClass = 'floor';
        this.number = number;
        this.maxFloor = maxFloor;
        this.generateQueue = this.generateQueue.bind(this);
        this.buildHTML();
        this.enqueuePassenger = this.enqueuePassenger.bind(this);
        this.getRandomQueuer = this.getRandomQueuer.bind(this);
    }
    setQueue(newQueue) {
        console.log(newQueue);
        this.queue = newQueue;
        this.HTML.innerHTML = '';
        this.queue.map(i => {
            const newPassengerHTML = this.getPassengerHTML(i.boundTo);
            this.HTML.appendChild(newPassengerHTML);
        });
    }
    generateQueue(elevatorManager) {
        let { queue, stopQueueFlag, generateQueue, getRandomQueuer, enqueuePassenger } = this;
        setTimeout(() => {
            enqueuePassenger(getRandomQueuer(), elevatorManager);
            if (!stopQueueFlag) {
                generateQueue(elevatorManager);
            }
        }, Math.random() * 20000);
    }
    dequeuePassenger(i) {
        this.HTML.removeChild(this.queue[i].HTML);
        this.queue.splice(i, 1);
    }
    enqueuePassenger(passenger, elevatorManager) {
        this.queue.push(passenger);
        passenger.HTML = this.getPassengerHTML(passenger.boundTo);
        this.HTML.appendChild(passenger.HTML);
        const elevator = elevatorManager();
        console.log(passenger.boundTo);
        elevator.call(this.number, passenger.boundTo);
    }
    getPassengerHTML(boundTo) {
        const el = document.createElement('div');
        el.classList.add('passenger');
        el.innerHTML = boundTo; // omg wtf type casting is crazee
        return el;
    }
    getRandomQueuer() {
        const boundTo = Math.round(Math.random() * (this.maxFloor - 1)); // floors are indexed from zero
        if (boundTo !== this.number)
            return { boundTo }; // define and obtain floors range from the environment
        else
            return this.getRandomQueuer();
        // prevent idiots that try to go onto the floor they already are
    }
    buildHTML() {
        this.HTML = document.createElement('div');
        this.HTML.classList.add(this.selectorClass);
        this.HTML.innerHTML = this.number;
    }
}
class Elevator extends HTMLRepresentable {
    constructor(building) {
        super();
        this.capacity = 6;
        this.occupants = [];
        this.speed = 500; // ms
        // private nextFloor : number = 0 // resting at ground floor
        this.queue = [];
        this.newQueue = [0];
        this.currentFloor = 0;
        this.onMove = false;
        this.HTML = document.createElement('div');
        this.HTML.classList.add('elevator');
        this.uponArrival = this.uponArrival.bind(this);
        this.building = building;
        this.HTML.addEventListener('transitionend', e => {
            console.log('lift has arrived TRANSITION');
            this.uponArrival();
        });
    }
    get nextFloor() {
        // if (this.queue[0] && this.queue[0][0])
        if (this.queue[0] && typeof this.queue[0][0] === "number")
            return this.queue[0][0];
    }
    moveTo(floorId) {
        if (typeof floorId === 'undefined') {
            console.log(new Error().stack);
        }
        console.log(this.onMove);
        let { speed, nextFloor } = this;
        const time = speed * Math.abs(this.currentFloor - floorId);
        console.log(floorId);
        if (time === 0) {
            this.uponArrival();
        }
        else {
            this.HTML.style.transitionDuration = time + 'ms';
            this.HTML.style.bottom = this.HTML.getBoundingClientRect().height * floorId + 'px';
        }
        // this.HTML.style.background = 'red'
        // neet to add the event only once
        if (this.onMove === false) {
            this.onMove = true;
        }
    }
    unLoad(floorId) {
        console.log('Floor to be dropped at:');
        const unloaded = [];
        this.occupants = this.occupants.map(i => {
            if (i.boundTo === floorId) {
                unloaded.push(i);
            }
            else {
                return i;
            }
        });
        return unloaded;
    }
    call(from, to) {
        let direction = from > to;
        for (let i = 0; i < this.queue.length; i++) {
            let subque = [...this.queue[i]];
            if (subque[0] > subque[1] === direction) {
                // check if it's first array and make a special case 
                // - check first floor number and check if the new item is not behind our vector starting point
                if (i === 0 && (direction === false && from < subque[0] || direction === true && from > subque[0]))
                    continue;
                subque = [...subque, to, from]
                    .reduce((acc, number) => {
                    if (acc.indexOf(number) < 0) {
                        acc.push(number);
                    }
                    return acc;
                }, [])
                    .sort();
                if (direction === true) {
                    subque = subque.reverse();
                }
                this.queue[i] = subque;
                direction = undefined; // flagging that the items have been allocated
                break;
            }
        }
        if (direction !== undefined) {
            this.queue.push([from, to]);
        }
        console.log(JSON.stringify(this.queue));
        console.log(JSON.stringify(this.nextFloor));
        if (this.onMove === false) {
            this.moveTo(this.nextFloor);
        }
    }
    uponArrival() {
        console.log('uponArrival Came In');
        const floor = this.building.floors[this.currentFloor];
        this.currentFloor = this.nextFloor; // saving the one we go to as the next on
        // remove the used floor from the queue
        this.queue[0].shift(); // this changes this.nextFloor value
        if (!this.queue[0].length)
            this.queue.shift();
        if (typeof this.nextFloor !== 'number') {
            this.onMove = false;
            return;
        }
        // get floor by ID here
        const unloaded = this.unLoad(this.currentFloor);
        console.log('Unloaded:');
        console.log(unloaded);
        const losers = this.load(floor.queue); // @TODO pass those back on the floor -> careful with referencing
        console.log('Loosers:');
        console.log(losers);
        floor.setQueue(losers);
        this.moveTo(this.nextFloor);
    }
}
class Building extends HTMLRepresentable {
    constructor({ floorsCount, container }) {
        super();
        this.floors = [];
        // [...Array(floorsCount)] --> typescript shits pants on that one
        // Also -> https://github.com/Microsoft/TypeScript/issues/16325
        let d = new Array(floorsCount);
        d.fill(0).map((o, i) => {
            this.floors.push(new Floor(i, d.length));
        });
        this.elevator = new Elevator(this);
        this.container = container;
        this.elevatorManager = this.elevatorManager.bind(this);
        this.build();
        this.deploy();
    }
    elevatorManager() {
        return this.elevator;
    }
    build() {
        this.HTML = document.createElement('div');
        this.HTML.classList.add('building');
        this.HTML.id = 'building';
        this.floors.map((floor) => {
            floor.generateQueue(this.elevatorManager);
            this.HTML.appendChild(floor.HTML);
        });
        this.HTML.appendChild(this.elevator.HTML);
    }
    deploy() {
        this.container.appendChild(this.HTML);
    }
}
const building = new Building({
    floorsCount: 5,
    container: document.getElementById("container")
});
building.deploy();
console.log(building);
//# sourceMappingURL=index.js.map