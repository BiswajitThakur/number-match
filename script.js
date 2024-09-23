"use strict";

function random_select(elem) {
  if (!Array.isArray(elem)) {
    throw new Error("input elem must be array.");
  }
  const len = elem.length;
  const rand_index = Math.floor(Math.random() * len);
  return elem[rand_index];
}

class MetrixCell {
  constructor(size) {
    let set_elem = new Set();
    for (let i = 1; i <= size; i++) {
      set_elem.add(i);
    }
    this.up = [];
    this.down = set_elem;
  }
  next(left) {
    let selectFrom = new Set();
    for (const elem of this.down) {
      selectFrom.add(elem);
    }
    for (const elem of left) {
      selectFrom.delete(elem);
    }
    for (const elem of this.up) {
      selectFrom.delete(elem);
    }
    if (selectFrom.size === 0) {
      return null;
    }
    let selected_val = random_select([...selectFrom]);
    this.up.push(selected_val);
    left.add(selected_val);
    this.down.delete(selected_val);
    return selected_val;
  }
}

class Metrix {
  constructor(size) {
    let val = [];
    for (let i = 0; i < size; i++) {
      val.push(new MetrixCell(size));
    }
    this.size = size;
    this.raw = 0;
    this.value = val;
  }
  next() {
    if (this.size == this.raw) {
      return null;
    }
    let new_raw = [];
    let left = new Set();
    for (let i = 0; i < this.size; i++) {
      let v = this.value[i].next(left);
      if (!v) {
        throw new Error("Faild to generate value.");
      }
      new_raw.push(v);
    }
    this.raw += 1;
    return new_raw;
  }
}

function create_mx(size) {
  let mx = new Metrix(size);
  let rc = [];
  while (true) {
    try {
      if (mx.size == mx.raw) {
        break;
      }
      let m = mx.next();
      if (!m) {
        mx = new Metrix(size);
        rc = [];
        break;
      }
      rc.push(m);
    } catch (err) {
      mx = new Metrix(size);
      rc = [];
    }
  }
  return rc;
}

function select_rand_from_metrix(size) {
  return [Math.floor(Math.random() * size), Math.floor(Math.random() * size)];
}

function create_node_elm(val) {
  const t_or_f = Math.floor(Math.random() * 3) == 0 ? true : false;
  const attr_name = "data-is";
  const input = document.createElement("input");
  input.setAttribute(attr_name, val);
  input.style.width = "100%";
  //alert(input.parentElement.height);
  // input.style.height = input.parentElement.style.height;
  input.style.overflow = "hidden";
  input.style.textAlign = "center";
  const elem = document.createElement("span");
  elem.setAttribute(attr_name, val);
  elem.textContent = val;
  elem.style.width = "100%";
  if (!t_or_f) {
    input.style.display = "none";
  } else {
    elem.style.display = "none";
  }
  return [input, elem];
}

function createRoot(size) {
  if (size > 13) {
    alert("Size must be less then or equal to 13");
    return;
  }
  let old_tbl = document.getElementById("my-table");
  const g = document.getElementById("my_game");
  if (old_tbl) {
    old_tbl.remove();
  }
  let root = document.createElement("table");
  root.id = "my-table";
  let my_table = create_mx(size);
  my_table.forEach((m) => {
    let tr = document.createElement("tr");
    m.forEach((n) => {
      let td = document.createElement("td");
      //td.innerHTML = n;
      const e = create_node_elm(n);
      td.appendChild(e[0]);
      td.appendChild(e[1]);
      tr.appendChild(td);
    });
    root.appendChild(tr);
  });
  g.appendChild(root);
}

const my_input = document.querySelector("#root > .my-input");

my_input.addEventListener("keyup", (e) => {
  if (!/^Digit\d+$/.test(e.code)) {
    my_input.value = my_input.value.replace(/\D/g, "");
  }
});

document.querySelector("#root > .create-game").addEventListener("click", () => {
  const user_input = parseInt(my_input.value.trim());
  createRoot(user_input);
  const level = document.getElementById("gm_lvl");
});

document.querySelector("#root > .reset").addEventListener("click", () => {
  alert("TODO");
});

document.querySelector("#root > .solve").addEventListener("click", () => {
  alert("TODO");
});
