/*

Create:
Elevator Class : interface graphic entity
Queue/Floor Class : interface graphic entity
Passenger Class / Interface : interface graphic entity
Elevator controller

*/

interface Passenger {
	boundTo: number
	HTML?: HTMLElement // unify maybe with class HTMLRepresentable
}

abstract class HTMLRepresentable {
	private _HTML : HTMLElement

	set HTML (HTML: HTMLElement) {
		this._HTML = HTML
	}

	get HTML () : HTMLElement {
		return this._HTML
	}
}

class Floor extends HTMLRepresentable {
	public queue: Array<Passenger> = []
	private stopQueueFlag : boolean = false
	public number: number
	public maxFloor: number
	private selectorClass: string = 'floor'

	constructor (number: number, maxFloor: number) {
		super()
		this.number = number
		this.maxFloor = maxFloor
		this.generateQueue = this.generateQueue.bind(this)
		this.buildHTML()
		this.enqueuePassenger = this.enqueuePassenger.bind(this)
		this.getRandomQueuer = this.getRandomQueuer.bind(this)
	}

	setQueue (newQueue: Array<Passenger>) {
		// console.log(JSON.stringify(newQueue))
		this.queue = newQueue
		this.HTML.innerHTML = ''
		this.queue.map(i => {
			const newPassengerHTML = this.getPassengerHTML(i.boundTo)
			this.HTML.appendChild(newPassengerHTML)
		})
	}

	generateQueue (elevatorManager: () => Elevator) { // create a type, use a type instead of this abomination
		let { queue, stopQueueFlag, generateQueue, getRandomQueuer, enqueuePassenger } = this
		setTimeout(() => {
			enqueuePassenger(getRandomQueuer(), elevatorManager)
			if (!stopQueueFlag) {
				generateQueue(elevatorManager)
			}
		}, Math.random() * 20000)
	}

	dequeuePassenger (i: number) { // gonna be called by the elevator upon load
		this.HTML.removeChild(this.queue[i].HTML)
		this.queue.splice(i,1)
	}

	enqueuePassenger (passenger: Passenger, elevatorManager: () => Elevator) {
		this.queue.push(passenger)
		passenger.HTML = this.getPassengerHTML(passenger.boundTo)
		this.HTML.appendChild(passenger.HTML)

		const elevator = elevatorManager()
		// console.log(passenger.boundTo)
		elevator.call(this.number, passenger.boundTo)
	}

	getPassengerHTML (boundTo: number) {
		const el = document.createElement('div')
		el.classList.add('passenger')
		el.innerHTML = <string> <unknown> boundTo // omg wtf type casting is crazee
		return el
	}

	getRandomQueuer () : Passenger {
		const boundTo = Math.round(Math.random() * (this.maxFloor - 1)) // floors are indexed from zero
		if (boundTo !== this.number) 
			return { boundTo } // define and obtain floors range from the environment
		else
			return this.getRandomQueuer()
		// prevent idiots that try to go onto the floor they already are
	}

	buildHTML () {
		this.HTML = document.createElement('div')
		this.HTML.classList.add(this.selectorClass)
		this.HTML.innerHTML = <string> <unknown> this.number
	}
}

class Elevator extends HTMLRepresentable {
	private capacity : number = 6
	private occupants : Array<Passenger> = []
	private speed : number = 900 // ms
	// private nextFloor : number = 0 // resting at ground floor
	private queue : Array<Array<number>> = []
	private newQueue : Array<number> = [0]
	public currentFloor: number = 0
	private building: Building
	private onMove: boolean = false

	// get occupants () : Array<Passenger> {
	// 	return this._occupants
	// }

	// set occupants (items: Array<Passenger>) { // setter and getter are for debugging purposes
	// 	console.log([...items])
	// 	this._occupants = items
	// }

	constructor (building: Building) {
		super()
		this.HTML = document.createElement('div')
		this.HTML.classList.add('elevator')
		this.uponArrival = this.uponArrival.bind(this)
		this.building = building

		this.HTML.addEventListener('transitionend', e => {
			this.uponArrival()
		})
	}

	get nextFloor () {
		// if (this.queue[0] && this.queue[0][0])
		if (this.queue[0] && typeof this.queue[0][0] === "number")
			return this.queue[0][0]
	}

	moveTo (floorId: number) { /* given the flights are identical */
		let { speed, nextFloor } = this
		const time = speed * Math.abs(this.currentFloor - floorId)
		if (time === 0) {
			this.uponArrival()
		}
		else {
			this.HTML.style.transitionDuration = time + 'ms'
			this.HTML.style.bottom = this.HTML.getBoundingClientRect().height * floorId + 'px'
		}
		// this.HTML.style.background = 'red'
		// neet to add the event only once
		if (this.onMove === false) {
			this.onMove = true
		} 
	}

	unLoad (currentFloor: number) {
		const unloaded : Array<Passenger> = []
		let frag = document.createDocumentFragment();
		this.occupants = this.occupants.reduce((acc, i) => {
			// console.log(i.HTML)
			
			if (i.boundTo === currentFloor) {
				unloaded.push(i)
			} else {
				acc.push(i)
				frag.appendChild(i.HTML)
			}
			return acc
		}, [])
		// console.log('---------------')
		this.HTML.innerHTML = ''
		this.HTML.appendChild(frag)
		return unloaded
		// console.log(JSON.stringify(this.occupants))
	}

	load (queue: Array<Passenger>) { // @TODO Load only those that go into the right direction
		const freeSpots = this.capacity - this.occupants.length
		const losers : Array<Passenger> = []
		let comers = queue.reduce((acc, passenger) => {
			// console.log(acc.length < freeSpots)
			// console.log(this.queue[0].indexOf(passenger.boundTo) >= 0)
			if (acc.length < freeSpots && this.queue[0].indexOf(passenger.boundTo) >= 0) {
				acc.push(passenger)
				this.HTML.appendChild(passenger.HTML)
			}
			else {
				losers.push(passenger)
			}
			return acc
		}, [])
		this.occupants = [...this.occupants, ...comers]
		return losers
	}

	uponArrival () {
		// console.log('uponArrival Came With')
		// console.log(this.occupants)

		this.currentFloor = this.nextFloor // saving the one we go to as the next on
		const floor = this.building.floors[this.currentFloor]
		// remove the used floor from the queue
		this.queue[0].shift() // this changes this.nextFloor value
		if (!this.queue[0].length)
			this.queue.shift()

		const unloaded = this.unLoad(this.currentFloor)

		// console.log("unloaded:")
		// console.log(unloaded)

		if (typeof this.nextFloor !== 'number') {
			this.onMove = false
			return
		}
		// get floor by ID here
		const losers : Array<Passenger> = this.load(floor.queue) // @TODO pass those back on the floor -> careful with referencing
		
		floor.setQueue(losers)
		this.moveTo(this.nextFloor)
	}

	call (from: number, to: number) {
		let direction = from > to
		for (let i = 0; i < this.queue.length; i++) {
			let subque = [...this.queue[i]]
			if(subque[0] > subque[1] === direction) {
				// check if it's first array and make a special case 
				// - check first floor number and check if the new item is not behind our vector starting point
				if (i === 0 && (direction === false && from < subque[0] || direction === true && from > subque[0]))
					continue
				subque = [...subque, to, from]
					.reduce( (acc, number) => {
						if (acc.indexOf(number) < 0) {
							acc.push(number)
						}
						return acc
					}, [])
					.sort()

				if (direction === true) {
					subque = subque.reverse()
				}
				this.queue[i] = subque
				direction = undefined // flagging that the items have been allocated
				break
			}
		}
		if (direction !== undefined) {
			this.queue.push([from, to])
		}
		if (this.onMove === false) {
			this.moveTo(this.nextFloor)
		}
	}
}

class Building extends HTMLRepresentable {
	public floors : Array<Floor> = []
	private elevator : Elevator
	private container : HTMLElement

	elevatorManager () : Elevator {
		return this.elevator
	}

	constructor ({ floorsCount, container } : any) {
		super()

		// [...Array(floorsCount)] --> typescript shits pants on that one
		// Also -> https://github.com/Microsoft/TypeScript/issues/16325
	
		let d : Array<Number> = new Array(floorsCount)
		d.fill(0).map((o,i) => {
			this.floors.push(new Floor(i, d.length))
		})

		this.elevator = new Elevator(this)
		this.container = container

		this.elevatorManager = this.elevatorManager.bind(this)

		this.build()
		this.deploy()
	}

	build () {
		this.HTML = document.createElement('div')
		this.HTML.classList.add('building')
		this.HTML.id = 'building'

		this.floors.map((floor) => {
			floor.generateQueue(this.elevatorManager)
			this.HTML.appendChild(floor.HTML)
		})

		this.HTML.appendChild(this.elevator.HTML)
	}

	deploy () {
		this.container.appendChild(this.HTML)
	}
}

const building = new Building({
	floorsCount: 10,
	container: document.getElementById("container")
});

building.deploy()
console.log(building)










