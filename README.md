# console trace

tarce your function. calc the case time.

when you have cluster process. you can use [mter](https://www.npmjs.com/package/mter) to split the log view.

## usage

```ts
// test/demo1.ts
import { console, registerClassDebug } from '../src/';
class A {
    async say(word) {
        console.log(word)
    }
}
registerClassDebug(A, 'A');

const a = new A();
a.say('qaq');
```

The log is not output by default. You need to configure environment variables:`TRACE` or `CONSOLE_PRO_TRACE`.

for example:
```shell
# in unix
TRACE='*' node your-app.js

# in windows cmd
set TRACE="*"
node your-app.js

# in windows powershell
$env:TRACE="*"
node your-app.js
```

now, run the `demo1.ts`:
`TRACE=* ts-node test/demo1.ts`

![image](https://user-images.githubusercontent.com/2151644/39671433-ec3e6f3a-514a-11e8-9b34-a6619e85469c.png)


> PS:the `console` instance is from [console-pro](https://www.npmjs.com/package/console-pro).

## about the `TRACE`

### example 1
```ts
registerClassDebug(A, 'A');
registerClassDebug(B, 'B');
```

```shell
TRACE="A,B"
```

### example 2
```ts
registerClassDebug(A, 'my/A');
registerClassDebug(B, 'my/B');
```

```shell
TRACE="my/*"
```

## extends config

you can define static function `getUnDebugMethodNames` for class to skip debug some function.
```ts
class A {
    async say(word) {
        console.log(word)
    }
    private _dosomething(cb){
        setTimeout(cb, 1000)
    }
    static getUnDebugMethodNames(){
        return ["_dosomething"]
    }
}
```

## debug an object

```ts
import { console, registerInstanceDebug } from '../src/';
registerInstanceDebug({
    async say(word) {
        console.log(word)
    }
    _dosomething(cb){
        setTimeout(cb, 1000)
    }
    getUnDebugMethodNames(){
        return ["_dosomething"]
    }
}, 'my/simple/instance');
```
