{{
	const Kind = {
    	interface: 'interface',
    	type: 'type',
        variant: 'variant',
        variantCase: 'variantCase',
        record: 'record',
        union: 'union',
        flags: 'flags',
        enum: 'enum',
        field: 'field',
        use: 'use',
        tuple: 'tuple',
        list: 'list',
        option: 'option',
        result: 'result',
        handle: 'handle',
        qualifiedName: 'qualifiedName',
        rename: 'rename',
        u8: 'u8',
        u16: 'u16',
        u32: 'u32',
        u64: 'u64',
        s8: 's8',
        s16: 's16',
        s32: 's32',
        s64: 's64',
        bool: 'bool',
        char: 'char',
        string: 'string',
        float32: 'float32',
        float64: 'float64',
        noResult: 'noResult',
        name: 'name',
        id: 'id',
    	multiLineComment: 'multiLineComment',
    	multiLineCommentOneLine: 'multiLineCommentOneLine',
        singleLineComment: 'singleLineComment',
        commentBlock: 'commentBlock'
    }

	function _loc(loc) {
        return {
        	start: loc.start,
            end: loc.end
        }
    }

	function split(use_path) {
    	const length = use_path.length;
        return {
        	path: use_path.slice(0, length - 1).join('.'),
        	type: use_path[length - 1]
        };
    }

	function trimTrailing(members, ch) {
    	if (members.length === 0) {
        	return members;
        }
        return members[members.length - 1] !== ch ? members : members.slice(0, members.length - 1);
    }

	function commentNode(items, text, loc) {
    	const filtered = [];
        for (const item of items) {
        	if (typeof item === 'string') {
            	continue;
            }
            filtered.push(item);
        }
        if (filtered.length === 0) {
        	return undefined;
        } else if (filtered.length === 1) {
        	return filtered[0];
        } else {
        	return {
            	kind: Kind.commentBlock,
                text: text,
                range: {
	             	start: loc.start,
    	            end: loc.end,
                },
                items: filtered
            }
        }
    }

    function attachComments(node, ...comments) {
    	if (comments === undefined || comments.length === 0) {
        	return;
        }
		let filtered = [];
        for (const comment of comments) {
        	if (Array.isArray(comment)) {
            	throw new Error('Should not happen');
            } else if (comment === null) {
            	filtered.push(undefined);
            } else if (typeof comment === 'object') {
            	filtered.push(comment);
            } else {
            	filtered.push(undefined);
            }
        }
        let end = filtered.length - 1;
        while (end >= 0 && filtered[end] === undefined) {
        	end--;
        }
        if (end < 0) {
        	return node;
        }
        if (end < filtered.length - 1) {
        	filtered = filtered.slice(0, end + 1)
        }
        node.comments = filtered;
        return node;
    }

    function node(kind, text, loc, props, ...comments) {
    	let result = {
        	kind: kind,
            text: text,
            range: {
            	start: loc.start,
                end: loc.end,
            }
        };
        const allComments = [];
        if (typeof props === 'object' && (props.kind === Kind.multiLineComment || props.kind === Kind.multiLineCommentOneLine || props.kind === Kind.singleLineComment || props.kind === Kind.commentBlock)) {
        	allComments.push(props);
        } else if (typeof props === 'string') {
        	props = undefined;
        }
        if (comments !== undefined && comments.length > 0) {
        	allComments.push(...comments);
        }
        result = props !== undefined ? Object.assign(result, props) : result;
        if (allComments.length > 0) {
        	attachComments(result, ...allComments);
        }
        return result;
    }
}}

start =
 	// comment
	interface_item
    _
    // __

reservedWord "reserved words"
 	= 'interface'
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

interface_item "interface declaration"
	= c1:_ 'default'? c2:_ 'interface' c3:_ name:id c4:_ '{' members:interface_items c5:_ '}' c6:__ {
     	return node(Kind.interface, text(), location(), { name, members }, c1, c2, c3, c4, c5, c6);
    }

interface_items
    = interface_member|.., lineTerminatorSequence|
	/ interface_member

interface_member
    = typedef_item
    / use_item

typedef_item
	= variant_items
    / record_item
    / union_items
    / flags_items
    / enum_items
	/ type_item

variant_items "variant"
	= c1:_ 'variant' c2:_ name:id c3:_ '{' members:variant_cases c4:_ '}' c5:__ {
    	return node(Kind.variant, text(), location(), { name, members }, c2, c2 ,c3, c4, c5);
    }

variant_cases "variant cases"
	= items:variant_case|0.., ','| sep:','? {
    	return items;
    }

variant_case
	= c1:_ name:id c2:_ '(' c3:_ type:ty c4:_ ')' c5:__ {
    	return node(Kind.variantCase, text(), location(), { name, type }, c1, c2, c3, c4, c5 );
    }
    / c1:_ name:id c2:__ {
    	return node(Kind.variantCase, text(), location(), { name }, c1, c2);
    }

record_item "record"
	= c1:_ 'record' c2:_ name:id c3:_ '{' members:record_fields c4:_ '}' c5:__ {
    	return node(Kind.record, text(), location(), { name, members: members }, c1, c2, c3, c4, c5);
    }

record_fields
	= items:record_field|0.., ','| sep:','? {
    	return items;
    }

record_field
	= c1:_ name:id c2:_ ':' c3:_ type:ty c4:__ {
    	return node(Kind.field, text(), location(), { name, type }, c1, c2, c3, c4);
    }

union_items "union"
	= c1:_ 'union' c2:_ name:id c3:_ '{' members:union_cases c4:_ '}' c5:__ {
    	return node(Kind.union, text(), location(), { name, members }, c1, c2, c2 ,c3, c4, c5);
    }

union_cases "union cases"
	= items:union_case|0.., ','| sep:','? {
    	return items;
    }

union_case "union case"
	= c1:_ type:ty c2:_ {
    	return attachComments(type, c1, c2);
    }

flags_items "flags"
	= c1:_ 'flags' c2:_ name:id c3:_ '{' members:flags_fields c4:_ '}' c5:__ {
    	return node(Kind.flags, text(), location(), { name, members }, c1, c2, c3, c4, c5);
    }

flags_fields "flag fields"
	= items:flags_field|0.., ','| sep:','? {
    	return items;
    }

flags_field "flag field"
	= c1:_ name:id c2:_ {
    	return attachComments(name, c1, c2);
    }

enum_items "enums"
	= c1:_ 'enum' c2:_ name:id c3:_ '{' members:enum_cases c4:_ '}' c5:__ {
    	return node(Kind.enum, text(), location(), { name, members }, c1, c2, c3, c4, c5);
    }

enum_cases "enum cases"
	= items:enum_case|0.., ','| sep:','? {
    	return items;
    }

enum_case "enum case"
	= c1:_ name:id c2:_ {
    	return attachComments(name, c1, c2);
    }

type_item "type"
	= c1:_ 'type' c2:_ name:id c3:_ '=' c4:_ type:ty c5:__ {
    	return node(Kind.type, text(), location(), { name, type }, c1, c2, c3, c4, c5);
    }

use_item "use"
	= c1:_ 'use' c2:_ path:use_path c3:_ '.' c4:_ '{' members:use_names_list c5:_ '}' c6:__ {
    	return node(Kind.use, text(), location(), { path, members }, c1, c2, c3, c4, c5, c6);
    }
    / c1:_ 'use' c2:_ path:use_path  {
    	return node(Kind.use, text(), location(), { path }, c1, c2);
    }

use_path "use path"
	= items:id_item|1..,'.'| {
    	return node(Kind.qualifiedName, text(), location(), { members: items });
    }

use_names_list "use names"
	= items:use_names_item|1..,','| sep:','? {
    	return items;
    }

use_names_item
    = oldName:id_item 'as' newName:id_item {
    	return node(Kind.rename, text(), location(), { oldName, newName });
    }
	/ id_item


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
    	return attachComments(type, c1, c2);
    }

tuple "tuple type"
	= 'tuple' c1:_ '<' list:tupleList '>' c2:__ {
    	return node(Kind.tuple, text(), location(), { items: list }, c1, c2);
    }

tupleList "tuple element list"
    = ty_item|.., ','|
	/ ty_item

list "element list"
	= 'list' _ '<' type:ty_item '>' {
    	return node(Kind.list, text(), location(), { type });
    }

option "option type"
	= 'option' _ '<' type:ty_item '>' {
    	return node(Kind.option, text(), location(), { type });
    }

result "result type"
	= 'result' _ '<' result:ty_item ',' error:ty_item '>' {
    	return node(Kind.result, text(), location(), { result, error });
    }
    / 'result' _ '<' result:no_result ',' error:ty_item '>' {
    	return node(Kind.result, text(), location(), { result, error });
    }
    / 'result' _ '<' error:ty_item '>' {
    	return node(Kind.result, text(), location(), { result: undefined, error });
    }
    / 'result' {
    	return node(Kind.result, text(), location(), { result: undefined, error: undefined });
    }

no_result "no result"
	= c1:_ '_' c2:_ {
    	return node(Kind.noResult, text(), location());
    }

handle "handle type"
	= id
    / 'borrow' c1:_ '<' name:id_item '>' {
    	return node(Kind.borrow, text(), location(), { name }, c1);
    }

id_item
	= c1:_ id:id c2:_ {
    	return attachComments(id, c1, c2);
    }

id "id"
	= name {
    	return node(Kind.id, text(), location());
    }

name "name"
	= !reservedWord label {
    	return node(Kind.name, text(), location());
    }
    / '%'label {
    	return node(Kind.name, text(), location());
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
    	return node(Kind.u8, text(), location())
    }

u16 "u16"
	= 'u16' {
    	return node(Kind.u16, text(), location())
    }

u32 "u32"
	= 'u32' {
    	return node(Kind.u32, text(), location())
    }

u64 "u64"
	= 'u64' {
    	return node(Kind.u64, text(), location())
    }

s8 "s8"
	= 's8' {
    	return node(Kind.s8, text(), location())
    }

s16 "s16"
	= 's16' {
    	return node(Kind.s16, text(), location())
    }

s32 "s32"
	= 's32' {
    	return node(Kind.s32, text(), location())
    }

s64 "s64"
	= 's64' {
    	return node(Kind.s64, text(), location())
    }

float32 "float32"
	= 'float32' {
    	return node(Kind.float32, text(), location())
    }

float64 "float64"
	= 'float64' {
    	return node(Kind.float64, text(), location())
    }

bool "bool"
	= 'bool' {
    	return node(Kind.bool, text(), location())
    }

char "char"
	= 'char' {
    	return node(Kind.char, text(), location())
    }

string "string"
	= 'string' {
    	return node(Kind.string, text(), location())
    }

__ "whitespace end of line"
	= space:[ ]* comment:(singleLineComment / multiLineCommentOneLine+)? {
    	return comment;
    }

_ "whitespace with comments"
	= items:(comment / s)* {
    	return commentNode(items, text(), location());
    }

comment "comment"
	= multiLineComment
	/ singleLineComment

multiLineComment "multi line comment"
	= '/*' (!'*/' .)* '*/' {
    	return node(Kind.multiLineComment, text(), location());
    }

multiLineCommentOneLine "multi line comment on one line"
	= '/*' (!('*/' / lineTerminatorSequence) .)* '*/' {
    	return node(Kind.multiLineCommentOneLine, text(), location());
    }

singleLineComment " single line comment"
	= '//' (!lineTerminator .)* {
    	return node(Kind.singleLineComment, text(), location());
    }

lineTerminator
	= [\n\r]

lineTerminatorSequence "end of line"
	= "\n"
    / "\r"
    / "\r\n"

s "whitespace"
	= [ \t\n\r] {
    	return text()
    }