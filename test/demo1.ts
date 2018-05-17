process.env.TRACE = "*, -B";
import { console, registerClassDebug } from '../src/';
class A {
    async say(word) {
        console.log(word)
    }
}
class B {
    async say(word) {
        console.log(word)
    }
}
class C {
    async say(word) {
        console.log(word)
    }
}
registerClassDebug(A, 'A');
registerClassDebug(B, 'B');
registerClassDebug(C, 'C');

const a = new A();
const b = new B();
const c = new C();
a.say('qaq');
b.say('qaq');
c.say('qaq');