# Bel HTML Exporter

A Node.js tool for exporting HTML content with advanced formatting and customization options.

## Features

- Export HTML content to various formats
- Customizable templates and styling
- Batch processing capabilities
- Command-line interface
- Programmatic API

## Prerequisites

- Node.js (version 14.0 or higher)
- npm or yarn package manager

## Installation

### Global Installation

```bash
npm install -g bel-html-exporter
```

### Local Installation

```bash
npm install bel-html-exporter
```

### Development Installation

```bash
git clone https://github.com/yourusername/bel-html-exporter.git
cd bel-html-exporter
npm install
```

## Usage

### Command Line Interface

```bash
# Basic usage
bel-html-exporter input.html output.pdf

# With options
bel-html-exporter input.html output.pdf --format pdf --template modern

# Batch processing
bel-html-exporter *.html --output-dir ./exports --format pdf
```

### Programmatic Usage

```javascript
const { HtmlExporter } = require("bel-html-exporter");

const exporter = new HtmlExporter({
  format: "pdf",
  template: "modern",
  outputDir: "./exports",
});

// Export single file
await exporter.export("input.html", "output.pdf");

// Export multiple files
await exporter.exportBatch(["file1.html", "file2.html"]);
```

## Configuration

Create a `bel-exporter.config.js` file in your project root:

```javascript
module.exports = {
  format: "pdf",
  template: "modern",
  outputDir: "./exports",
  options: {
    margin: "1cm",
    format: "A4",
    printBackground: true,
  },
};
```

## API Reference

### HtmlExporter

#### Constructor Options

| Option      | Type   | Default    | Description                    |
| ----------- | ------ | ---------- | ------------------------------ |
| `format`    | string | 'pdf'      | Output format (pdf, png, jpeg) |
| `template`  | string | 'default'  | Template to use                |
| `outputDir` | string | './output' | Output directory               |

#### Methods

- `export(inputPath, outputPath)` - Export single file
- `exportBatch(inputPaths, options)` - Export multiple files
- `setTemplate(templateName)` - Change template
- `getAvailableTemplates()` - List available templates

## Templates

Available templates:

- `default` - Basic styling
- `modern` - Clean, modern design
- `minimal` - Minimal styling
- `corporate` - Professional business template

## Development

### Setup

```bash
npm install
npm run dev
```

### Testing

```bash
npm test
npm run test:watch
```

### Building

```bash
npm run build
```

### Linting

```bash
npm run lint
npm run lint:fix
```

## Scripts

| Script          | Description               |
| --------------- | ------------------------- |
| `npm start`     | Start the application     |
| `npm run dev`   | Start in development mode |
| `npm test`      | Run tests                 |
| `npm run build` | Build for production      |
| `npm run lint`  | Run linter                |

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow ESLint configuration
- Write tests for new features
- Update documentation as needed
- Use conventional commit messages

## Troubleshooting

### Common Issues

**Error: Module not found**

```bash
npm install
```

**Permission denied**

```bash
sudo npm install -g bel-html-exporter
```

**Template not found**

- Check available templates with `bel-html-exporter --list-templates`
- Ensure template name is spelled correctly

## Changelog

### [1.0.0] - 2024-01-01

- Initial release
- Basic HTML to PDF export
- Command-line interface
- Template system

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

- 📧 Email: support@example.com
- 🐛 Issues: [GitHub Issues](https://github.com/yourusername/bel-html-exporter/issues)
- 📖 Documentation: [Wiki](https://github.com/yourusername/bel-html-exporter/wiki)

## Acknowledgments

- Thanks to all contributors
- Built with Node.js and modern web technologies
- Inspired by the need for better HTML export tools
