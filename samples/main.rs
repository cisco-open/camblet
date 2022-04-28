use dns_parser::Packet;
use std::ffi::CString;

// import some WASM runtime functions from the module `env`
#[link(wasm_import_module = "env")]
extern "C" {
    fn _debug(s: &str) -> i32;
    fn clock_ns() -> i64;
}

#[no_mangle]
pub static mut SOURCE: [i8; 20] = [0; 20];
#[no_mangle]
pub static mut DESTINATION: [i8; 20] = [0; 20];
#[no_mangle]
pub static mut DNS_PACKET: [u8; 512] = [0; 512];

// source: &str, destination: &str
#[no_mangle]
extern "C" fn dns_query(id: i32) {
    unsafe {
        let source = CString::from_raw(SOURCE.as_mut_ptr());
        let destination = CString::from_raw(DESTINATION.as_mut_ptr());

        let mut s = format!(
            "wasm3: {}: dns_query {} -> source ip: {}, destination ip: {}",
            clock_ns(),
            id,
            source.to_string_lossy(),
            destination.to_string_lossy(),
        );

        _debug(&s);

        match Packet::parse(&DNS_PACKET[..]) {
            Ok(dns) => {
                s = format!("wasm3: {:?}", dns);
                _debug(&s);
            }
            Err(e) => {
                s = format!("wasm3: {:?}", e);
                _debug(&s);
            }
        }
    }
}

#[no_mangle]
// source: &str, destination: &str
extern "C" fn dns_response(id: i32) {
    unsafe {
        let source = CString::from_raw(SOURCE.as_mut_ptr());
        let destination = CString::from_raw(DESTINATION.as_mut_ptr());

        let mut s = format!(
            "wasm3: {}, dns_response {} -> source ip: {}, destination ip: {}",
            clock_ns(),
            id,
            source.to_string_lossy(),
            destination.to_string_lossy(),
        );

        _debug(&s);

        match Packet::parse(&DNS_PACKET[..]) {
            Ok(dns) => {
                s = format!("wasm3: {:?}", dns);
                _debug(&s);
            }
            Err(e) => {
                s = format!("wasm3: {:?}", e);
                _debug(&s);
            }
        }
    }
}

fn main() {
    unsafe {
        _debug("wasm3: hello world");
    }
}
