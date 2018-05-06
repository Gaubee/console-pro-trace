import { console, registerClassDebug } from '../src/';
class A {
    async say(word) {
        console.log(word)
    }
}
registerClassDebug(A, 'A');

const a = new A();
a.say('qaq');