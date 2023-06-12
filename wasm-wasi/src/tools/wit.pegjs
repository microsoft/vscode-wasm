{{
	const Kind = {
        tuple: 'tuple',
        list: 'list',
        option: 'option',
        result: 'result',
        handle: 'handle',
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
        identifier: 'identifier',
        name: 'name',
        id: 'id',
    	multiLineComment: 'multiLineComment',
    	multiLineCommentOneLine: 'multiLineCommentOneLine',
        singleLineComment: 'singleLineComment',
    }

	function _loc(loc) {
        return {
        	start: loc.start,
            end: loc.end
        }
    }

    function node(kind, text, loc, rest) {
    	const result = {
        	kind: kind,
            text: text,
            range: {
            	start: loc.start,
                end: loc.end,
            }
        };
        return rest !== undefined ? Object.assign(result, rest) : result;
    }

    function attachComments(node, ...comments) {
    	if (comments === undefined || comments.length === 0) {
        	return;
        }
		const filtered = [];
        for (const comment of comments) {
            if (typeof comment === 'object') {
            	filtered.push(comment);
            }
        }
        if (filtered.length > 0) {
        	node.comments = filtered;
        }
        return node;
    }

}}

start =
 	// comment
	tuple
    // __

reservedWords "reserved words"
 	= 'interface'
	/ 'func'
    / 'tuple'
    / 'list'
    / 'option'
    / 'result'
    / 'borrow'
	/ baseTypes

builtInTypes "built in types"
	= baseTypes
    / tuple
    / list
    / option
    / result
    / handle
    / id

tuple "tuple type"
	= 'tuple' c1:_ '<' list:tupleList '>' c2:__ {
    	return node(Kind.tuple, text(), location(), { c1: c1, c2: c2, items: list });
    }

tupleList "tuple element list"
    = tupleItem|.., ','|
	/ tupleItem

tupleItem
	= c1:_ type:builtInTypes c2:_ { return attachComments(type, c1, c2); }

list "element list"
	= 'list' _ '<' _ type:builtInTypes _ '>' {
    	return node(Kind.list, text(), location(), { type: type });
    }

option "option type"
	= 'option' _ '<' _ type:builtInTypes _ '>' {
    	return node(Kind.option, text(), location(), { type: type });
    }

result "result type"
	= 'result' _ '<' _ result:builtInTypes _ ',' _ error:builtInTypes _ '>' {
    	return node(Kind.result, text(), location(), { result: result, error: error });
    }
    / 'result' _ '<' _ '_' _ ',' _ error:builtInTypes _ '>' {
    	return node(Kind.result, text(), location(), { result: undefined, error: error });
    }
    / 'result' _ '<' _ error:builtInTypes _ '>' {
    	return node(Kind.result, text(), location(), { result: undefined, error: error });
    }
    / 'result' {
    	return node(Kind.result, text(), location(), { result: undefined, error: undefined });
    }

handle "handle type"
	= id
    / 'borrow' _ '<' _ id: id _ '>' {
    	return node(Kind.borrow, text(), location(), { id: id });
    }

id "id"
	= name {
    	return node(Kind.id, text(), location());
    }

identifier "identifier"
	= name {
    	return node(Kind.identifier, text(), location());
    }

name "name"
	= label {
    	return node(Kind.name, text(), location());
    }

label "label"
	= word|..,'-'| {
    	return {
        	text: text()
        };
    }

word "word"
	= [a-z]i[0-9a-z]i* {
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
	= comment / s

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
	= [ \t\n\r]* {
    	return text()
    }