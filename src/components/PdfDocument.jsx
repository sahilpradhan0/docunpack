import { Page, Text, View, Document, StyleSheet } from "@react-pdf/renderer";

// Styles
const styles = StyleSheet.create({
    page: { padding: 20, fontSize: 12, fontFamily: "Helvetica" },
    heading1: { fontSize: 18, marginBottom: 10, fontWeight: "bold" },
    heading2: { fontSize: 16, marginBottom: 8, fontWeight: "bold" },
    heading3: { fontSize: 14, marginBottom: 6, fontWeight: "bold" },
    paragraph: { marginBottom: 5 },
    listItem: { marginBottom: 3, paddingLeft: 10 },
    codeBlock: {
        backgroundColor: "black",
        color: "white",
        padding: 5,
        marginVertical: 5,
        fontSize: 10,
    },
    inlineCode: {
        backgroundColor: "#eee",
        padding: 2,
    },
    bold: { fontWeight: "bold" },
    italic: { fontStyle: "italic" },
});

// Parse Markdown
function parseMarkdown(text) {
    const lines = text.split("\n");
    const blocks = [];
    let inCode = false;
    let codeContent = [];
    let listBuffer = [];

    const flushList = () => {
        if (listBuffer.length) {
            blocks.push({ type: "list", items: [...listBuffer] });
            listBuffer = [];
        }
    };

    for (let line of lines) {
        if (line.startsWith("```")) {
            if (inCode) {
                flushList();
                blocks.push({ type: "code", content: codeContent.join("\n") });
                inCode = false;
                codeContent = [];
            } else {
                inCode = true;
            }
        } else if (inCode) {
            codeContent.push(line);
        } else if (line.startsWith("# ")) {
            flushList();
            blocks.push({ type: "heading1", content: line.replace(/^# /, "") });
        } else if (line.startsWith("## ")) {
            flushList();
            blocks.push({ type: "heading2", content: line.replace(/^## /, "") });
        } else if (line.startsWith("### ")) {
            flushList();
            blocks.push({ type: "heading3", content: line.replace(/^### /, "") });
        } else if (line.startsWith("- ")) {
            listBuffer.push(line.replace(/^- /, ""));
        } else if (line.trim() === "") {
            flushList();
            blocks.push({ type: "paragraph", content: "" });
        } else {
            flushList();
            blocks.push({ type: "paragraph", content: line });
        }
    }
    flushList();
    return blocks;
}

// Render Markdown inline styles
function renderInlineStyles(text) {
    // bold **text**
    let parts = text.split(/(\*\*.*?\*\*)|(`.*?`)|(_.*?_)/g).filter(Boolean);

    return parts.map((part, i) => {
        if (part.startsWith("**") && part.endsWith("**")) {
            return <Text key={i} style={styles.bold}>{part.slice(2, -2)}</Text>;
        }
        if (part.startsWith("_") && part.endsWith("_")) {
            return <Text key={i} style={styles.italic}>{part.slice(1, -1)}</Text>;
        }
        if (part.startsWith("`") && part.endsWith("`")) {
            return <Text key={i} style={styles.inlineCode}>{part.slice(1, -1)}</Text>;
        }
        return <Text key={i}>{part}</Text>;
    });
}

// PDF Component
const PdfDocument = ({ output }) => {
    if (!output) return null;
    const blocks = parseMarkdown(output.simplified_text || "");

    return (
        <Document>
            <Page style={styles.page}>
                {blocks.map((block, i) => {
                    switch (block.type) {
                        case "heading1":
                            return <Text key={i} style={styles.heading1}>{renderInlineStyles(block.content)}</Text>;
                        case "heading2":
                            return <Text key={i} style={styles.heading2}>{renderInlineStyles(block.content)}</Text>;
                        case "heading3":
                            return <Text key={i} style={styles.heading3}>{renderInlineStyles(block.content)}</Text>;
                        case "paragraph":
                            return <Text key={i} style={styles.paragraph}>{renderInlineStyles(block.content)}</Text>;
                        case "list":
                            return (
                                <View key={i} style={{ marginBottom: 5 }}>
                                    {block.items.map((item, idx) => (
                                        <Text key={idx} style={styles.listItem}>• {renderInlineStyles(item)}</Text>
                                    ))}
                                </View>
                            );
                        case "code":
                            return (
                                <Text key={i} style={styles.codeBlock}>
                                    {block.content}
                                </Text>
                            );
                        default:
                            return null;
                    }
                })}
            </Page>
        </Document>
    );
};

export default PdfDocument;
