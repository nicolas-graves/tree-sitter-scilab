import os
import xml.etree.ElementTree as ET
from tree_sitter import Language, Parser


SCILAB_LANGUAGE = Language(os.environ.get("TREE_SITTER_SCILAB_PATH"), "scilab")
parser = Parser()
parser.set_language(SCILAB_LANGUAGE)
targeted_modules = ["core", "data_structures"]


def parse_xml_file(xml_file):
    tree = ET.parse(xml_file)
    root = tree.getroot()

    # Extract programlisting with role 'example'
    programlistings = root.findall(
        './/{http://docbook.org/ns/docbook}programlisting[@role="example"]'
    )
    examples = [programlisting.text.strip() for programlisting in programlistings]

    return examples


def transform_examples(examples):
    # Parse a first time to find comments, i.e. lines starting with //
    comments = []
    description = "Doc Example"
    for line in examples[0].split("\n"):
        if line.strip().startswith("//"):
            comments.append(line.strip().lstrip("//").strip())
    if comments:
        description = " ".join(comments)

    # Split the examples according to the comments.
    split_examples = [[]]
    for line in examples[0].split("\n"):
        if line.strip().startswith("//"):
            split_examples.append([])
        else:
            split_examples[-1].append(line.strip())

    # Capitalize all words in the description
    description = description.capitalize()

    # Create a list of (example, description) pairs
    example_pairs = [
        ("\n".join(example) + "\n", description) for example in split_examples
    ]

    return example_pairs


def format_sexpression(s, indent_level=0, indent_size=4):
    """https://gist.github.com/TACIXAT/c5b2db4a80c812c4b4373b65e179a220"""
    output = ""
    i = 0
    # Initialize to False to avoid newline for the first token
    need_newline = False
    cdepth = []  # Track colons
    while i < len(s):
        if s[i] == "(":
            output += "\n" + " " * (indent_level * indent_size) + "("
            indent_level += 1
            need_newline = False  # Avoid newline after opening parenthesis
        elif s[i] == ":":
            indent_level += 1
            cdepth.append(indent_level)  # Store depth where we saw colon
            output += ":"
        elif s[i] == ")":
            indent_level -= 1
            if len(cdepth) > 0 and indent_level == cdepth[-1]:
                # Unindent when we return to the depth we saw the last colon
                cdepth.pop()
                indent_level -= 1
            output += ")"
            need_newline = True  # Newline needed after closing parenthesis
        elif s[i] == " ":
            output += " "
        else:
            j = i
            while j < len(s) and s[j] not in ["(", ")", " ", ":"]:
                j += 1
            # Add newline and indentation only when needed
            if need_newline:
                output += "\n" + " " * (indent_level * indent_size)
            output += s[i:j]
            i = j - 1
            need_newline = True  # Next token should start on a new line
        i += 1
    return output


def process_directory(directory, output_directory):
    for root, dirs, files in os.walk(directory):
        for file in files:
            if file.endswith(".xml"):
                xml_file = os.path.join(root, file)
                examples = parse_xml_file(xml_file)
                if examples != []:
                    example_pairs = transform_examples(examples)

                    # Write examples content directly to a .txr file
                    output_path = os.path.join(
                        output_directory,
                        os.path.relpath(root, directory),
                        file.replace(".xml", ".txt"),
                    )
                    os.makedirs(os.path.dirname(output_path), exist_ok=True)
                    with open(output_path, "w") as f:
                        File = file[:-4].capitalize()
                        for example, description in example_pairs:
                            f.write(80 * "=" + "\n")
                            f.write(f"{File}: {description}\n")
                            f.write(80 * "=" + "\n")
                            f.write(example + "\n")
                            f.write(80 * "-" + "\n")
                            f.write(
                                format_sexpression(
                                    parser.parse(
                                        bytes(example, "utf8")
                                    ).root_node.sexp()
                                )
                                + "\n\n"
                            )


if __name__ == "__main__":
    current_directory = os.path.dirname(os.path.realpath(__file__))
    xml_directory = os.path.join(current_directory, "..", "scilab", "scilab", "modules")
    output_directory = os.path.join(current_directory, "corpus")
    for root, dirs, files in os.walk(xml_directory):
        if "/help/en_US/" in root:
            if any(module in root for module in targeted_modules):
                process_directory(root, output_directory)
