;; generated by ./wasm/generateInterface.js
(import $return "ethereum" "return" (param i32 i32) )
(func $RETURN 
  (param $sp i32)(local $offset0 i32)(local $length0 i32)(local $memstart i32) (set_local $memstart (i32.const 33832)) (set_local $offset0 
    (call $check_overflow
      (i64.load (i32.add (get_local $sp) (i32.const 0)))
      (i64.load (i32.add (get_local $sp) (i32.const 8)))
      (i64.load (i32.add (get_local $sp) (i32.const 16)))
      (i64.load (i32.add (get_local $sp) (i32.const 24)))))(set_local $length0 
    (call $check_overflow 
      (i64.load (i32.add (get_local $sp) (i32.const -32)))
      (i64.load (i32.add (get_local $sp) (i32.const -24)))
      (i64.load (i32.add (get_local $sp) (i32.const -16)))
      (i64.load (i32.add (get_local $sp) (i32.const -8)))))

    (call $memusegas (get_local $offset0) (get_local $length0))
    (set_local $offset0 (i32.add (get_local $memstart) (get_local $offset0))) (call_import $return(get_local $offset0)(get_local $length0)))