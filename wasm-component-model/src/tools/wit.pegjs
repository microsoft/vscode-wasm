{{

const ast = require('./wit-ast');
const Node = ast.Node;

function range(loc) {
    return {
        start: loc.start,
        end: loc.end
    }
}

}}

start = wit_document

wit_document
	= pack:package_decl? members:(interface_item / world_item)* c1:_ {
        return Node.finalize(ast.Document.create(range(location()), pack, members), c1);
    }

package_decl "package declaration"
	= c1:_ 'package' c2:_ id:package_id c3:__ {
        return Node.finalize(ast.PackageItem.create(range(location()), id), c1, c2, c3);
    }

package_id "package id"
	= namespace:(namespace:id_item ':' { return namespace; })? name:id_item version:('@' version:version_number { return version; })? c1:__ {
        return Node.finalize(ast.PackageIdentifier.create(range(location()), namespace, name, version), c1);
    }

version_number "version number"
	= [^ \t\n\r]+ {
        return Node.finalize(ast.VersionNumber.create(range(location()), text()));
    }

toplevel_use_item "top level use"
    = c1:_ 'use' inter:toplevel_use_interface ('as' c2:_ name:id { return name; })? c3:__ {
        return Node.finalize(ast.TopLevelUseItem.create(range(location()), inter, name), c1, c2, c3);
    }

toplevel_use_interface "top level use interface"
    = namespace:id_item ':' name:id_item '/' imp:id_item version:('@' version:version_number { return version; })? c1:__ {
        return Node.finalize(ast.TopLevelUseInterface.create(range(location()), namespace, name, imp, version), c1);
    }
    / namepsace:id_item {
        return Node.finalize(ast.TopLevelUseInterface.create(range(location()), namespace, undefined, undefined, undefined));
    }

world_item "world declaration"
	= c1:_ 'world' c2:_ name:id c3:_ '{' members:world_items c4:_ '}' c5:__ {
        return Node.finalize(ast.WorldItem.create(range(location()), name, members), c1, c2, c3, c4, c5);
    }

world_items
	= world_members|.., lineTerminatorSequence|

world_members
	= export_item
    / import_item
    / use_item
    / typedef_item

export_item
	= c1:_ 'export' c2:_ name:id c3:_ ':' type:extern_type c4:__ {
        return Node.finalize(ast.ExportItem.create(range(location()), name, type), c1, c2, c3, c4);
    }

import_item
	= c1:_ 'import' c2:_ name:id c3:__ {
        return Node.finalize(ast.ImportItem.create(range(location()), name), c1, c2, c3);
    }

extern_type
	= func_type
    / interface_type

interface_item "interface declaration"
	= c1:_ 'interface' c2:_ name:id c3:_ '{' members:interface_items c4:_ '}' c5:__ {
        return Node.finalize(ast.InterfaceItem.create(range(location()), name, members), c1, c2, c3, c4, c5);
    }

interface_type "interface type"
    = c1:_ 'interface' c2:_ '{' members:interface_items c3:_ '}' c4:__ {
        return Node.finalize(ast.InterfaceType.create(range(location()), members), c1, c2, c3, c4);
    }

interface_items
    = interface_member|.., lineTerminatorSequence|

interface_member
    = typedef_item
    / use_item
    / func_item

typedef_item
	= variant_items
    / record_item
    / union_items
    / flags_items
    / enum_items
	/ type_item

variant_items "variant"
	= c1:_ 'variant' c2:_ name:id c3:_ '{' members:variant_cases c4:_ '}' c5:__ {
        return Node.finalize(ast.VariantItem.create(range(location()), name, members), c1, c2, c3, c4, c5);
    }

variant_cases "variant cases"
	= items:variant_case|0.., ','| sep:','? {
    	return items;
    }

variant_case
	= c1:_ name:id c2:_ '(' type:ty_item ')' c3:__ {
        return Node.finalize(ast.VariantCase.create(range(location()), name, type), c1, c2, c3);
    }
    / c1:_ name:id c2:__ {
        return Node.finalize(ast.VariantCase.create(range(location()), name), c1, c2);
    }

record_item "record"
	= c1:_ 'record' c2:_ name:id c3:_ '{' members:record_fields c4:_ '}' c5:__ {
        return Node.finalize(ast.RecordItem.create(range(location()), name, members), c1, c2, c3, c4, c5);
    }

record_fields
	= items:record_field|0.., ','| sep:','? {
    	return items;
    }

record_field
	= name:id_item ':' type:ty_item_ {
        return Node.finalize(ast.RecordField.create(range(location()), name, type));
    }

union_items "union"
	= c1:_ 'union' c2:_ name:id c3:_ '{' members:union_cases c4:_ '}' c5:__ {
        return Node.finalize(ast.UnionItem.create(range(location()), name, members), c1, c2, c3, c4, c5);
    }

union_cases "union cases"
	= items:union_case|0.., ','| sep:','? {
    	return items;
    }

union_case "union case"
	= type:ty_item {
    	return type;
    }

flags_items "flags"
	= c1:_ 'flags' c2:_ name:id c3:_ '{' members:flags_fields c4:_ '}' c5:__ {
        return Node.finalize(ast.FlagsItem.create(range(location()), name, members), c1, c2, c3, c4, c5);
    }

flags_fields "flag fields"
	= items:flags_field|0.., ','| sep:','? {
    	return items;
    }

flags_field "flag field"
	= name:id_item {
    	return name;
    }

enum_items "enums"
	= c1:_ 'enum' c2:_ name:id c3:_ '{' members:enum_cases c4:_ '}' c5:__ {
        return Node.finalize(ast.EnumItem.create(range(location()), name, members), c1, c2, c3, c4, c5);
    }

enum_cases "enum cases"
	= items:enum_case|0.., ','| sep:','? {
    	return items;
    }

enum_case "enum case"
	= name:id_item {
    	return name;
    }

type_item "type"
	= c1:_ 'type' c2:_ name:id c3:_ '=' c4:_ type:ty c5:__ {
        return Node.finalize(ast.TypeItem.create(range(location()), name, type), c1, c2, c3, c4, c5);
    }

use_item "use"
	= c1:_ 'use' c2:_ pack:package_id c3:_ '/' c4:_ importItem:renamed_item c5:__ {
        return Node.finalize(ast.UseItem.create(range(location()), pack, importItem), c1, c2, c3, c4, c5);
    }
	/ c1:_ 'use' c2:_ pack:package_id c3:_ '/' c4:_ namedImports:named_imports c5:__ {
        return Node.finalize(ast.UseItem.create(range(location()), pack, namedImports), c1, c2, c3, c4, c5);
    }
	/ c1:_ 'use' c2:_ pack:package_id c3:_ '/' c4:_ item:id c5:__ {
        return Node.finalize(ast.UseItem.create(range(location()), pack, item), c1, c2, c3, c4, c5);
    }
    / c1:_ 'use' namedImports:named_imports c2:__ {
        return Node.finalize(ast.UseItem.create(range(location()), undefined, namedImports), c1, c2);
    }
	/ c1:_ 'use' item:id_item_ c2:__ {
        return Node.finalize(ast.UseItem.create(range(location()), undefined, item), c1, c2);
    }

renamed_item "renamed identifier"
    = from:id c1:_ 'as' c2:_ to:id {
        return Node.finalize(ast.RenameItem.create(range(location()), from, to), c1, c2);
    }

named_imports "named imports"
    = item:id_item '.' c1:_ '{' members:use_names_list c2:_ '}' {
        return Node.finalize(ast.NamedImports.create(range(location()), item, members), c1, c2);
    }

use_names_list "use names"
	= items:use_names_item|1..,','| sep:','? {
    	return items;
    }

use_names_item
    = from:id_item 'as' to:id_item {
        return Node.finalize(ast.RenameItem.create(range(location()), from, to));
    }
	/ id_item

func_item "function"
	= c1:_ name:id c2:_ ':' signature:func_type {
        return Node.finalize(ast.FuncItem.create(range(location()), name, signature), c1, c2);
    }

func_type
	= c1:_ 'func' c2:_ params:param_list c3:_ result:result_list c4:__ {
        return Node.finalize(ast.FuncType.create(range(location()), params, result), c1, c2, c3, c4);
    }
	/ c1:_ 'func' c2:_ params:param_list c3:__ {
        return Node.finalize(ast.FuncType.create(range(location()), params), c1, c2, c3);
    }

param_list
	= '(' members:named_type_list c1:_ ')' {
        return Node.finalize(ast.FuncParams.create(range(location()), members), c1);
    }

result_list
	= '->' c1:_ '(' members:named_type_list c2:_ ')' {
        return Node.finalize(ast.NamedFuncResult.create(range(location()), members), c1, c2);
    }
	/ '->' c1:_ type:ty {
        return Node.finalize(ast.FuncResult.create(range(location()), type), c1);
    }

named_type_list
	= items:named_type|0..,','| sep:','? {
    	return items;
    }

named_type
	= name:id_item ':' type:ty_item {
    	return Node.finalize(ast.NamedType.create(range(location()), name, type));
    }

ty "built in types"
	= baseTypes
    / tuple
    / list
    / option
    / result
    / handle
    / id

ty_item "build in type with comment"
	= c1:_ type:ty c2:_ {
        const result = Node.attachComments(type, c1, c2);
        result.range = range(location());
    	return result;
    }

ty_item_ "build in type with comment"
	= c1:_ type:ty c2:__ {
        const result = Node.attachComments(type, c1, c2);
        result.range = range(location());
    	return result;
    }

tuple "tuple type"
	= 'tuple' c1:_ '<' members:tupleList '>' {
        return Node.finalize(ast.Tuple.create(range(location()), members), c1);
    }

tupleList "tuple element list"
    = ty_item|.., ','|
	/ ty_item

list "element list"
	= 'list' c1:_ '<' type:ty_item '>' {
        return Node.finalize(ast.List.create(range(location()), type), c1);
    }

option "option type"
	= 'option' c1:_ '<' type:ty_item '>' {
        return Node.finalize(ast.Option.create(range(location()), type), c1);
    }

result "result type"
	= 'result' c1:_ '<' ok:ty_item ',' error:ty_item '>' {
        return Node.finalize(ast.Result.create(range(location()), ok, error), c1);
    }
    / 'result' c1:_ '<' ok:no_result ',' error:ty_item '>' {
        return Node.finalize(ast.Result.create(range(location()), ok, error), c1);
    }
    / 'result' c1:_ '<' error:ty_item '>' {
        return Node.finalize(ast.Result.create(range(location()), undefined, error), c1);
    }
    / 'result' {
        return Node.finalize(ast.Result.create(range(location()), undefined, undefined), c1);
    }

no_result "no result"
	= c1:_ '_' c2:_ {
    	return Node.finalize(ast.NoResultType.create(range(location())), c1, c2);
    }

handle "handle type"
	= id
    / 'borrow' c1:_ '<' name:id_item '>' {
    	return Node.finalize(ast.Borrow.create(range(location()), name), c1);
    }

id_item
	= c1:_ id:id c2:_ {
    	return Node.finalize(ast.Identifier.create(range(location()), id.value), c1, c2);
    }

id_item_
	= c1:_ id:id c2:__ {
    	return Node.finalize(ast.Identifier.create(range(location()), id.value), c1, c2);
    }

id "id"
	= name:name {
    	return ast.Identifier.create(range(location()), name);
    }

reservedWord "reserved words"
 	= 'package'
    / 'world'
    / 'import'
    / 'export'
    / 'interface'
    / 'use'
	/ 'func'
    / 'variant'
    / 'record'
    / 'union'
    / 'flags'
    / 'enum'
    / 'type'
    / 'tuple'
    / 'list'
    / 'option'
    / 'result'
    / 'borrow'
	/ baseTypes

name "name"
    = '%'label {
    	return text();
    }
	/ !(reservedWord (' ' / comment / lineTerminator)) label {
    	return text();
    }


label "label"
	= word|1..,'-'| {
    	return text();
    }

word "word"
	= ([a-z]i)([0-9a-z]i)* {
    	return text();
    }

baseTypes "base types"
	= u8 / u16 / u32 / u64
    / s8 / s16 / s32 / s64
    / float32 / float64
    / bool
    / char
    / string

u8 "u8"
	= 'u8' {
    	return ast.u8.create(range(location()));
    }

u16 "u16"
	= 'u16' {
    	return ast.u16.create(range(location()));
    }

u32 "u32"
	= 'u32' {
    	return ast.u32.create(range(location()));
    }

u64 "u64"
	= 'u64' {
    	return ast.u64.create(range(location()));
    }

s8 "s8"
	= 's8' {
    	return ast.s8.create(range(location()));
    }

s16 "s16"
	= 's16' {
    	return ast.s16.create(range(location()));
    }

s32 "s32"
	= 's32' {
    	return ast.s32.create(range(location()));
    }

s64 "s64"
	= 's64' {
    	return ast.s64.create(range(location()));
    }

float32 "float32"
	= 'float32' {
    	return ast.float32.create(range(location()));
    }

float64 "float64"
	= 'float64' {
    	return ast.float64.create(range(location()));
    }

bool "bool"
	= 'bool' {
    	return ast.bool.create(range(location()));
    }

char "char"
	= 'char' {
    	return ast.char.create(range(location()));
    }

string "string"
	= 'string' {
    	return ast.string_.create(range(location()));
    }

__ "whitespace end of line"
	= space:[ \t]* comment:(singleLineComment / multiLineCommentOneLine+)? {
    	return comment;
    }

_ "whitespace with comments"
	= items:(comment / s)* {
    	return ast.Comment.create(range(location()), items);
    }

comment "comment"
	= multiLineComment
	/ singleLineComment

multiLineComment "multi line comment"
	= '/*' (!'*/' .)* '*/' {
    	return ast.MultiLineComment.create(range(location()), text());
    }

multiLineCommentOneLine "multi line comment on one line"
	= '/*' (!('*/' / lineTerminatorSequence) .)* '*/' {
    	return ast.MultiLineCommentOneLine.create(range(location()), text());
    }

singleLineComment " single line comment"
	= '//' (!lineTerminator .)* {
    	return ast.SingleLineComment.create(range(location()), text());
    }

lineTerminator
	= [\n\r]

lineTerminatorSequence "end of line"
	= '\n'
    / '\r'
    / '\r\n'

s "whitespace"
	= [ \t\n\r] {
    	return text()
    }