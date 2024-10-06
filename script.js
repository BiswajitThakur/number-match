"use strict";

let game_table = null; // root element of game table

let game_elements = null;

// For Undo Redo
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

function encode_game(elm) {
  let raws = [];
  elm.forEach((e) => {
    let raw = [];
    e.forEach((v) => {
      if (!v.disabled) {
        raw.push(`i${v.getAttribute("data-is")}`);
      } else {
        raw.push(`${v.getAttribute("data-is")}`);
      }
    });
    raws.push(raw.join("|"));
  });
  return btoa(raws.join("-"));
}

function gen_lvl(size, lvl) {
  const total = size * size;
  let to_rm = 0;
  if (lvl < 2) {
    to_rm = Math.floor(total * (1 / 3));
  } else if (lvl == 2) {
    to_rm = Math.floor(total * (1 / 2));
  } else {
    to_rm = Math.floor(total * (2 / 3));
  }
  let arr = [];
  for (let i = 0; i < size; i++) {
    let a = [];
    for (let j = 0; j < size; j++) {
      a.push(false);
    }
    arr.push(a);
  }
  let true_count = 0;
  let total_try = 0;
  while (total_try < 900000) {
    const ranw_raw = Math.floor(Math.random() * size);
    const rand_coll = Math.floor(Math.random() * size);
    if (!arr[rand_coll][ranw_raw]) {
      arr[rand_coll][ranw_raw] = true;
      true_count += 1;
    }
    total_try += 1;
    if (true_count >= to_rm) {
      break;
    }
  }
  const attr_name = "data-is";
  return function (r, c, val) {
    const input = document.createElement("input");
    input.setAttribute(attr_name, val);
    input.setAttribute("type", "number");
    input.style.width = "100%";
    input.style.overflow = "hidden";
    input.style.textAlign = "center";
    if (arr[r][c]) {
      input.addEventListener("change", () => {
        push_input_history(input);
      });
    } else {
      input.value = val;
      input.disabled = true;
    }
    return input;
  };
}

function create_node_elm(val, lvl) {
  const t_or_f = Math.floor(Math.random() * lvl) == 0 ? true : false;
  const attr_name = "data-is";
  const input = document.createElement("input");
  input.setAttribute(attr_name, val);
  input.setAttribute("type", "number");
  input.style.width = "100%";
  input.style.overflow = "hidden";
  input.style.textAlign = "center";
  if (t_or_f) {
    input.value = val;
    input.disabled = true;
  } else {
    input.addEventListener("change", () => {
      push_input_history(input);
    });
  }
  return input;
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
  let root = document.createElement("div");
  root.id = "game";
  let elements = [];
  raws.forEach((raw) => {
    let table_raw = document.createElement("div");
    table_raw.className = "game-raws";
    let rr = [];
    raw.forEach((v) => {
      let td = document.createElement("input");
      const val = v.replace(/^i/, "");
      td.setAttribute("data-is", val);
      td.setAttribute("type", "number");
      td.style.textAlign = "center";
      if (/^i\d+$/.test(v)) {
        td.addEventListener("change", () => {
          push_input_history(td);
        });
      } else if (/^\d+$/.test(v)) {
        td.value = val;
        td.disabled = true;
      } else {
        throw new Error("ERROR: invalid hash.");
      }
      rr.push(td);
      table_raw.appendChild(td);
    });
    elements.push(rr);
    root.appendChild(table_raw);
  });
  if (game_table) {
    game_table.remove();
  }
  game_table = root;
  const g = document.getElementById("game_cnt");
  g.appendChild(root);
  return elements;
}

function createRoot(size, lvl) {
  if (size > 13) {
    alert("Size must be less then or equal to 13");
    return;
  }
  let root = document.createElement("div");
  root.id = "game";
  let my_table = create_mx(size);
  let my_lvl = gen_lvl(size, lvl);
  let elements = [];
  for (let i = 0; i < size; i++) {
    let tr = document.createElement("div");
    tr.className = "game-raws";
    let tr_arr = [];
    for (let j = 0; j < size; j++) {
      const e = my_lvl(i, j, my_table[i][j]);
      tr_arr.push(e);
      tr.appendChild(e);
    }
    root.appendChild(tr);
    elements.push(tr_arr);
  }
  game_table = root;
  const g = document.getElementById("game_cnt");
  g.appendChild(root);
  return elements;
}

try {
  game_elements = import_game(window.location.hash);
  document.getElementById("create_new_inp").value = game_elements.length;
} catch (err) {
  console.error(err);
}

const my_input = document.getElementById("create_new_inp");

my_input.addEventListener("keyup", (e) => {
  if (!/^Digit\d+$/.test(e.code)) {
    my_input.value = my_input.value.replace(/\D/g, "");
  }
});

document.getElementById("create_new").addEventListener("click", () => {
  const value = my_input.value.trim();
  if (/^\s*$/.test(value)) {
    return;
  }
  if (game_table) {
    game_table.remove();
  }
  input_history = [];
  undo = [];
  const user_input = parseInt(value);
  const lvl = document.getElementById("game_lvl").value;
  //alert(lvl);
  const elm = createRoot(user_input, parseInt(lvl));
  game_elements = elm;
  window.location.hash = encode_game(elm);
});

document.getElementById("reset").addEventListener("click", () => {
  if (!game_elements || !Array.isArray(game_elements)) {
    return;
  }
  input_history = [];
  undo = [];
  game_elements.forEach((m) => {
    m.forEach((n) => {
      if (!n.disabled) {
        n.value = "";
      }
    });
  });
});

document.getElementById("solve").addEventListener("click", () => {
  if (!game_elements || !Array.isArray(game_elements)) {
    return;
  }
  game_elements.forEach((m) => {
    m.forEach((n) => {
      if (!n.disabled) {
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
      if (!n.disabled) {
        if (n.value !== n.getAttribute("data-is")) {
          is_win = false;
        }
      }
    });
  });
  alert("This features is under development.\nIt's not 100% accurate.");
  if (is_win) {
    alert("You win");
  } else {
    alert("Wrong input");
  }
});
