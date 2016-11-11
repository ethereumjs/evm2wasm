const fs = require('fs')
const path = require('path')

const interfaceManifest = {
  // LOG: {
  //   name: 'log',
  //   input: ['readOffset', 'length', 'i32', 'pointer', 'pointer', 'pointer', 'pointer'],
  //   output: []
  // },
  // CALLDATALOAD: {
  //   name: 'callDataCopy256',
  //   input: ['pointer'],
  //   output: ['i256'],
  //   reverse: true
  // },
  GAS: {
    name: 'getGasLeft',
    input: [],
    output: ['i64']
  },
  ADDRESS: {
    name: 'getAddress',
    input: [],
    output: ['address']
  },
  BALANCE: {
    name: 'getBalance',
    async: true,
    input: ['address'],
    output: ['i128']
  },
  ORIGIN: {
    name: 'getTxOrigin',
    input: [],
    output: ['address']
  },
  CALLER: {
    name: 'getCaller',
    input: [],
    output: ['address']
  },
  CALLVALUE: {
    name: 'getCallValue',
    input: [],
    output: ['i128']
  },
  CALLDATASIZE: {
    name: 'getCallDataSize',
    input: [],
    output: ['i32']
  },
  CALLDATACOPY: {
    name: 'callDataCopy',
    input: ['writeOffset', 'i32', 'length'],
    output: []
  },
  CODESIZE: {
    name: 'getCodeSize',
    async: true,
    input: [],
    output: ['i32']
  },
  CODECOPY: {
    name: 'codeCopy',
    async: true,
    input: ['writeOffset', 'i32', 'length'],
    output: []
  },
  EXTCODESIZE: {
    name: 'getExternalCodeSize',
    async: true,
    input: ['address'],
    output: ['i32']
  },
  EXTCODECOPY: {
    name: 'externalCodeCopy',
    async: true,
    input: ['pointer', 'writeOffset', 'i32', 'length'],
    output: []
  },
  GASPRICE: {
    name: 'getTxGasPrice',
    input: [],
    output: ['i32']
  },
  BLOCKHASH: {
    name: 'getBlockHash',
    async: true,
    input: ['i32'],
    output: ['i256']
  },
  COINBASE: {
    name: 'getBlockCoinbase',
    input: [],
    output: ['address']
  },
  TIMESTAMP: {
    name: 'getBlockTimestamp',
    input: [],
    output: ['i32']
  },
  NUMBER: {
    name: 'getBlockNumber',
    input: [],
    output: ['i32']
  },
  DIFFICULTY: {
    name: 'getBlockDifficulty',
    input: [],
    output: ['i256']
  },
  GASLIMIT: {
    name: 'getBlockGasLimit',
    input: [],
    output: ['i32']
  },
  CREATE: {
    name: 'create',
    async: true,
    input: ['pointer', 'readOffset', 'length'],
    output: ['address']
  },
  CALL: {
    name: 'call',
    async: true,
    input: ['i64', 'pointer', 'pointer', 'readOffset', 'length', 'writeOffset', 'length'],
    output: ['i32']
  },
  CALLCODE: {
    name: 'callCode',
    async: true,
    input: ['i32', 'pointer', 'pointer', 'readOffset', 'length', 'writeOffset', 'length'],
    output: ['i32']
  },
  DELEGATECALL: {
    name: 'callDelegate',
    async: true,
    input: ['i32', 'pointer', 'pointer', 'readOffset', 'length', 'writeOffset', 'length'],
    output: ['i32']
  },
  SSTORE: {
    name: 'storageStore',
    async: true,
    input: ['pointer', 'pointer'],
    output: []
  },
  SLOAD: {
    name: 'storageLoad',
    async: true,
    input: ['pointer'],
    output: ['i256']
  },
  SUICIDE: {
    name: 'selfDestruct',
    input: ['pointer'],
    output: []
  },
  RETURN: {
    name: 'return',
    input: ['readOffset', 'length'],
    output: []
  }
}

for (let opcode in interfaceManifest) {
  const op = interfaceManifest[opcode]
    // generate the import params
  let inputs = op.input.map(input => input === 'i64' ? 'i64' : 'i32').concat(op.output.filter(type => type !== 'i32' && type !== 'i64').map(() => 'i32'))
  let params = ''

  if (op.async) {
    inputs.push('i32')
  }

  if (inputs.length) {
    params = `(param ${inputs.join(' ')})`
  }

  let result = ''
  const firstResult = op.output[0]
  if (firstResult === 'i32' || firstResult === 'i64') {
    result = `(result ${firstResult})`
  }
  // generate import
  let wasm = `;; generated by ./wasm/generateInterface.js
(import $${op.name} "ethereum" "${op.name}" ${params} ${result})\n`
    // generate function
  wasm += `(func $${opcode} 
  (param $sp i32)
  `
  if (op.async) {
    wasm += '(param $callback i32)'
  }

  let locals = ''
  let body = ''

  // generate the call to the interface
  let spOffset = 0
  let numOfLocals = 0
  let usesMem = false
  let lastOffset
  let call = `(call_import $${op.name}`
  op.input.forEach((input) => {
    if (input === 'address') {
      if (spOffset) {
        call += `(i32.add (i32.const 12) (call $bswap_m256 (i32.add (get_local $sp) (i32.const ${spOffset * 32}))))`
      } else {
        call += '(i32.add (i32.const 12) (call $bswap_m256 (get_local $sp)))'
      }
    } else if (input === 'pointer') {
      if (spOffset) {
        call += `(call $bswap_m256 (i32.add (get_local $sp) (i32.const ${spOffset * 32})))`
      } else {
        call += '(call $bswap_m256 (get_local $sp))'
      }
    } else if (input === 'i32') {
      call += `(call $check_overflow
           (i64.load (i32.add (get_local $sp) (i32.const ${spOffset * 32})))
           (i64.load (i32.add (get_local $sp) (i32.const ${spOffset * 32 + 8})))
           (i64.load (i32.add (get_local $sp) (i32.const ${spOffset * 32 + 8 * 2})))
           (i64.load (i32.add (get_local $sp) (i32.const ${spOffset * 32 + 8 * 3}))))`
    } else if (input === 'i64') {
      call += `(call $check_overflow_i64
           (i64.load (i32.add (get_local $sp) (i32.const ${spOffset * 32})))
           (i64.load (i32.add (get_local $sp) (i32.const ${spOffset * 32 + 8})))
           (i64.load (i32.add (get_local $sp) (i32.const ${spOffset * 32 + 8 * 2})))
           (i64.load (i32.add (get_local $sp) (i32.const ${spOffset * 32 + 8 * 3}))))`
    } else if (input === 'writeOffset' || input === 'readOffset') {
      lastOffset = input
      locals += `(local $offset${numOfLocals} i32)`
      body += `(set_local $offset${numOfLocals} 
    (call $check_overflow
      (i64.load (i32.add (get_local $sp) (i32.const ${spOffset * 32})))
      (i64.load (i32.add (get_local $sp) (i32.const ${spOffset * 32 + 8})))
      (i64.load (i32.add (get_local $sp) (i32.const ${spOffset * 32 + 8 * 2})))
      (i64.load (i32.add (get_local $sp) (i32.const ${spOffset * 32 + 8 * 3})))))`
      call += `(get_local $offset${numOfLocals})`
      usesMem = true
    } else if (input === 'length') {
      locals += `(local $length${numOfLocals} i32)`
      body += `(set_local $length${numOfLocals} 
    (call $check_overflow 
      (i64.load (i32.add (get_local $sp) (i32.const ${spOffset * 32})))
      (i64.load (i32.add (get_local $sp) (i32.const ${spOffset * 32 + 8})))
      (i64.load (i32.add (get_local $sp) (i32.const ${spOffset * 32 + 8 * 2})))
      (i64.load (i32.add (get_local $sp) (i32.const ${spOffset * 32 + 8 * 3})))))

    (call $memusegas (get_local $offset${numOfLocals}) (get_local $length${numOfLocals}))
    (set_local $offset${numOfLocals} (i32.add (get_local $memstart) (get_local $offset${numOfLocals})))`

      if (lastOffset === 'writeOffset') {
        body += `(call $memset 
    (get_local $offset${numOfLocals}) 
    (i32.const 0)
    (get_local $length${numOfLocals}))`
      }

      call += `(get_local $length${numOfLocals})`
      numOfLocals++
    }
    spOffset--
  })

  spOffset++

  // generate output handling
  const output = op.output.shift()
  if (output === 'i128') {
    call =
      `${call} (i32.add (get_local $sp) (i32.const ${spOffset * 32}))`

    if (op.async) {
      call += '(get_local $callback)'
    }

    call += `)
    ;; zero out mem
    (i64.store (i32.add (get_local $sp) (i32.const ${spOffset * 32 + 8 * 3})) (i64.const 0))
    (i64.store (i32.add (get_local $sp) (i32.const ${spOffset * 32 + 8 * 2})) (i64.const 0))`
  } else if (output === 'address') {
    call =
      `${call} (i32.add (get_local $sp) (i32.const ${spOffset * 32}))`

    if (op.async) {
      call += '(get_local $callback)'
    }

    call += `)
    ;; zero out mem
    (i64.store (i32.add (get_local $sp) (i32.const ${spOffset * 32 + 8 * 3})) (i64.const 0))
    (i32.store (i32.add (get_local $sp) (i32.const ${spOffset * 32 + 8 * 2 + 4})) (i32.const 0))`
  } else if (output === 'i256') {
    call = `${call} 
    (i32.add (get_local $sp) 
    (i32.const ${spOffset * 32}))`

    if (op.async) {
      call += '(get_local $callback)'
    }

    call += ') (call $bswap_m256 (i32.add (i32.const 32) (get_local $sp)))'
  } else if (output === 'i32') {
    if (op.async) {
      call += '(get_local $callback)'
    }

    call =
      `(i64.store
    (i32.add (get_local $sp) (i32.const ${spOffset * 32}))
    (i64.extend_u/i32
      ${call})))

    ;; zero out mem
    (i64.store (i32.add (get_local $sp) (i32.const ${spOffset * 32 + 8 * 3})) (i64.const 0))
    (i64.store (i32.add (get_local $sp) (i32.const ${spOffset * 32 + 8 * 2})) (i64.const 0))
    (i64.store (i32.add (get_local $sp) (i32.const ${spOffset * 32 + 8})) (i64.const 0))`
  } else if (output === 'i64') {
    if (op.async) {
      call += '(get_local $callback)'
    }
    call =
      `(i64.store (i32.add (get_local $sp) (i32.const ${spOffset * 32})) ${call}))

    ;; zero out mem
    (i64.store (i32.add (get_local $sp) (i32.const ${spOffset * 32 + 8 * 3})) (i64.const 0))
    (i64.store (i32.add (get_local $sp) (i32.const ${spOffset * 32 + 8 * 2})) (i64.const 0))
    (i64.store (i32.add (get_local $sp) (i32.const ${spOffset * 32 + 8})) (i64.const 0))`
  } else if (!output) {
    if (op.async) {
      call += '(get_local $callback)'
    }
    call += ')'
  }

  if (usesMem) {
    locals += '(local $memstart i32) (set_local $memstart (i32.const 33832))'
  }

  wasm += `${locals} ${body} ${call})`

  fs.writeFileSync(path.join(__dirname, opcode + '.wast'), wasm)
}
