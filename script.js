"use strict";

let game_table = null;
let game_elements = null;
let input_history = [];
let undo = [];

function push_input_history(elm) {
  input_history.push([elm.value, elm]);
}

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

  if (!t_or_f) {
    const elem = document.createElement("span");
    elem.setAttribute(attr_name, val);
    elem.textContent = val;
    elem.style.width = "100%";
    return elem;
  } else {
    const input = document.createElement("input");
    input.setAttribute(attr_name, val);
    input.setAttribute("type", "number");
    input.style.width = "100%";
    input.style.overflow = "hidden";
    input.style.textAlign = "center";
    input.addEventListener("change", () => {
      push_input_history(input);
    });
    return input;
  }
}

function import_game(val) {
  if (typeof val != "string") {
    return;
  }
  let raws = atob(val.split("$")[0].replace(/^#/, ""))
    .split("-")
    .map((v) => v.split("|"));
  if (raws.length < 2) {
    return;
  }
  let root = document.createElement("table");
  root.id = "my-table";
  game_elements = [];
  raws.forEach((raw) => {
    let table_raw = document.createElement("tr");
    let rr = [];
    raw.forEach((v) => {
      let td = document.createElement("td");
      if (/^i\d+$/.test(v)) {
        let input = document.createElement("input");
        input.setAttribute("data-is", v.replace(/^i/, ""));
        input.setAttribute("type", "number");
        input.style.width = "100%";
        input.style.overflow = "hidden";
        input.style.textAlign = "center";
        input.addEventListener("change", () => {
          push_input_history(input);
        });
        rr.push(input);
        td.appendChild(input);
        table_raw.appendChild(td);
        return;
      } else if (/^\d+$/.test(v)) {
        const elem = document.createElement("span");
        elem.setAttribute("data-is", v);
        elem.textContent = v;
        elem.style.width = "100%";
        rr.push(elem);
        td.appendChild(elem);
        table_raw.appendChild(td);
        return;
      }
      throw new Error("ERROR: invalid hash.");
    });
    game_elements.push(rr);
    root.appendChild(table_raw);
  });
  const g = document.getElementById("my_game");
  if (game_table) {
    game_table.remove();
  }
  game_table = root;
  g.appendChild(root);
}
try {
  import_game(window.location.hash);
} catch (err) {
  console.error(err);
}

function encode_game(elm) {
  let raws = [];
  elm.forEach((e) => {
    let raw = [];
    e.forEach((v) => {
      if (v.tagName === "INPUT") {
        raw.push(`i${v.getAttribute("data-is")}`);
      } else {
        raw.push(`${v.getAttribute("data-is")}`);
      }
    });
    raws.push(raw.join("|"));
  });
  return btoa(raws.join("-"));
}

function createRoot(size) {
  if (size > 13) {
    alert("Size must be less then or equal to 13");
    return;
  }
  const g = document.getElementById("my_game");
  if (game_table) {
    game_table.remove();
  }
  let root = document.createElement("table");
  root.id = "my-table";
  let my_table = create_mx(size);
  game_elements = [];
  my_table.forEach((m) => {
    let tr = document.createElement("tr");
    let tr_arr = [];
    m.forEach((n) => {
      let td = document.createElement("td");
      const e = create_node_elm(n);
      td.appendChild(e);
      tr_arr.push(e);
      tr.appendChild(td);
    });
    root.appendChild(tr);
    game_elements.push(tr_arr);
  });
  game_table = root;
  g.appendChild(root);
}

const my_input = document.querySelector("#root > .my-input");

my_input.addEventListener("keyup", (e) => {
  if (!/^Digit\d+$/.test(e.code)) {
    my_input.value = my_input.value.replace(/\D/g, "");
  }
});

document.querySelector("#root > .create-game").addEventListener("click", () => {
  const value = my_input.value.trim();
  if (/^\s*$/.test(value)) {
    return;
  }
  input_history = [];
  undo = [];
  const user_input = parseInt(value);
  createRoot(user_input);
  window.location.hash = encode_game(game_elements);
});

document.querySelector("#root > .reset").addEventListener("click", () => {
  if (!game_elements || !Array.isArray(game_elements)) {
    return;
  }
  game_elements.forEach((m) => {
    m.forEach((n) => {
      if (n.tagName === "INPUT") {
        n.value = "";
      }
    });
  });
});

document.querySelector("#root > .solve").addEventListener("click", () => {
  if (!game_elements || !Array.isArray(game_elements)) {
    return;
  }
  game_elements.forEach((m) => {
    m.forEach((n) => {
      if (n.tagName === "INPUT") {
        n.value = n.getAttribute("data-is");
      }
    });
  });
});

document.getElementById("undo").addEventListener("click", () => {
  if (input_history.length === 0) {
    return;
  }
  const poped = input_history.pop();
  poped[1].value = "";
  undo.push(poped);
});
document.getElementById("redo").addEventListener("click", () => {
  if (undo.length === 0) {
    return;
  }
  const poped = undo.pop();
  poped[1].value = poped[0];
  input_history.push(poped);
});

const share = document.getElementById("share");
share.addEventListener("click", () => {
  if (!game_elements) {
    alert("Please create new game, then share.");
    return;
  }
  let loc = new URL(window.location.href);
  loc.hash = encode_game(game_elements);
  navigator.clipboard
    .writeText(loc.toString())
    .then(() => {
      share.textContent = "Link copied";
      setTimeout(() => {
        share.textContent = "Share";
      }, 4000);
    })
    .catch((_) => {
      alert("Faild to copy link");
    });
});

document.getElementById("varify").addEventListener("click", () => {
  if (!game_elements || !Array.isArray(game_elements)) {
    return;
  }
  let is_win = true;
  game_elements.forEach((m) => {
    m.forEach((n) => {
      if (n.tagName === "INPUT") {
        if (n.value !== n.getAttribute("data-is")) {
          is_win = false;
        }
      }
    });
  });
  if (is_win) {
    alert("You win");
  } else {
    alert("Wrong input");
  }
});
