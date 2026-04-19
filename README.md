# 🧠 CNN Feature Extraction Visualizer

> **An interactive, step-by-step educational tool for visualizing how Convolutional Neural Networks process images — from raw pixels to final predictions.**

🔗 **Live Demo:** [https://prathvichavan.github.io/cnn-feature-visualizer](https://prathvichavan.github.io/cnn-feature-visualizer)

---

## 📖 About

The **CNN Feature Extraction Visualizer** is an educational web application that demystifies how CNNs work by walking users through each layer of the pipeline interactively. Built for students, educators, and ML enthusiasts, it lets you *see* the math happen — not just read about it.

The visualizer uses the **MNIST handwritten digit dataset** as its input, guiding you from a raw 28×28 grayscale image all the way through to a final 10-class probability prediction.

---

## ✨ Features

- 🎬 **Animated step-by-step execution** — step through or auto-play each layer's computation
- 🔍 **Interactive feature maps** — hover over cells to trace values back to their source
- 🧮 **Live formula display** — see the math update in real time as the network runs
- 🏗️ **Full architecture overview** — understand the complete pipeline and data shape at every stage
- 📊 **Parameter breakdown** — view exact weight and bias counts per layer
- 🎛️ **Configurable controls** — change digit class, padding, stride, edge filter, and activation type
- 📱 **Responsive design** — works on desktop and mobile

---

## 🗺️ Pipeline Modules

The app is divided into six interactive modules, each covering a distinct layer in the CNN:

| Module | Description | Input → Output |
|---|---|---|
| **Convolution** | A 3×3 filter slides across the image, detecting edges and patterns | 28×28 → 26×26 |
| **Activation (ReLU)** | Applies non-linearity — negative values become zero | 26×26 → 26×26 |
| **Pooling** | A 2×2 max pooling window reduces spatial dimensions | 26×26 → 13×13 |
| **Flatten** | Reshapes the 2D feature map into a 1D vector (row-major order) | 13×13 → 169 |
| **Dense + Softmax** | Fully connected layer produces class scores; softmax converts to probabilities | 169 → 10 |
| **Architecture Overview** | Birds-eye view of the full pipeline with parameter counts | — |

---

## 🏛️ Model Architecture

```
Input Layer        →  28 × 28 × 1   (784 pixels, grayscale)
Convolution (3×3)  →  26 × 26 × 1   (9 weights, 0 biases)
Activation (ReLU)  →  26 × 26 × 1   f(x) = max(0, x)
Max Pooling (2×2)  →  13 × 13 × 1   (stride 2, reduces by 75%)
Flatten            →  169 × 1        (row-major order)
Dense Layer        →  10 × 1         (1,690 weights + 10 biases)
Softmax            →  10 × 1         (probabilities summing to 1)
```

**Total Parameters: 1,709** (1,699 weights + 10 biases)

---

## 🎛️ Interactive Controls

Each module shares a unified controls panel:

| Control | Options | Effect |
|---|---|---|
| **Digit Class** | 0–9 (MNIST digits) | Selects which handwritten digit to visualize |
| **Padding** | 0 (Valid), 1, 2 | Controls output size relative to input |
| **Stride** | 1, 2 | Controls how far the filter moves each step |
| **Edge Filter** | Top, Bottom, Left, Right, All Edges, Sharpen | Selects the convolution kernel |
| **Activation Type** | None, ReLU, Sigmoid, Softmax | Selects the activation function to apply |
| **Animation** | Step / Play / Reset | Controls playback of the layer computation |

---

## 🧩 Pooling Types Compared

The pooling module lets you compare four pooling strategies side-by-side:

- **Max Pooling** — keeps the strongest activation (most common in CNNs)
- **Min Pooling** — keeps the weakest activation
- **Average Pooling** — averages all values in the window
- **Global Average Pooling** — produces one value per channel

---

## 📐 Key Formulas

**Convolution:**
```
Output[i,j] = Σ (Input[i+m, j+n] × Filter[m,n])
```

**Output Size:**
```
Output = ⌊(N - K + 2P) / S⌋ + 1
```
*where N = input size, K = kernel size, P = padding, S = stride*

**Flatten Index Mapping:**
```
vector[i] = grid[row][col]   where i = row × width + col
```

**Dense Layer:**
```
y_j = Σ (x_i × w_ij) + b_j
```

**Softmax:**
```
softmax(z_i) = e^(z_i) / Σ e^(z_j)
```

---

## 🚀 Getting Started

The visualizer is a fully static web application — no build step or backend required.

**Option 1 — Visit the live site:**
```
https://prathvichavan.github.io/cnn-feature-visualizer
```

**Option 2 — Run locally:**
```bash
git clone https://github.com/prathvichavan/cnn-feature-visualizer.git
cd cnn-feature-visualizer
# Open index.html in your browser, or serve with any static file server:
npx serve .
```

---

## 🗂️ Project Structure

```
cnn-feature-visualizer/
├── index.html              # Home page — module selector
├── single-page.html        # Full pipeline on a single page
├── convolution.html        # Convolution layer module
├── activation.html         # Activation function module
├── pooling.html            # Pooling layer module
├── flatten.html            # Flatten layer module
├── dense.html              # Dense + Softmax module
├── architecture.html       # Full architecture overview
├── assets/
│   ├── css/                # Stylesheets
│   └── js/                 # Layer computation logic & animations
└── README.md
```

---

## 🎓 Educational Use Cases

- 📚 **Classroom demos** — explain CNN layers visually without writing code
- 🔬 **Lab assignments** — students can step through computations and verify results manually
- 🧑‍💻 **Self-study** — an interactive companion to any CNN textbook or course
- 🎤 **Conference/talk slides** — live demos of feature extraction in the browser

---

## 🛠️ Tech Stack

| Technology | Usage |
|---|---|
| **HTML5 / CSS3** | Structure and styling |
| **Vanilla JavaScript** | Layer computations and animations |
| **MNIST Data** | Sample digit images for visualization |

No frameworks, no bundlers, no dependencies — just pure web standards.

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/my-feature`
3. Commit your changes: `git commit -m 'Add my feature'`
4. Push to the branch: `git push origin feature/my-feature`
5. Open a Pull Request

---

## 📬 Contact

**Prathviraj Chavan**

[![LinkedIn](https://img.shields.io/badge/LinkedIn-Connect-blue?style=flat&logo=linkedin)](https://www.linkedin.com/in/prathvichavan)
[![GitHub](https://img.shields.io/badge/GitHub-prathvichavan-black?style=flat&logo=github)](https://github.com/prathvichavan)

---

## 📄 License

This project is open-source and available for academic and educational use.

© 2026 CNN Feature Visualizer. Developed with ❤️ by Prathviraj Chavan for academic demonstration.

---

<div align="center">
  <strong>⭐ Star this repo if you found it helpful!</strong>
</div>
