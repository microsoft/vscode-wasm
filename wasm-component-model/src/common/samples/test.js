/* eslint-disable no-console */
class F {
	  constructor() {
		this.a = 1;
	}
	foo() {
		return this.a;
	}
}

F.prototype['bar'] = function() {
	return this.a + 1;
};

const f = new F();
console.log(f.foo());
console.log(f.bar());