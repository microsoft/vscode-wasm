{{
	const Kind = {
    	multiLineComment: 'multiLineComment',
        singleLineComment: 'singleLineComment',
        tuple: 'tuple',
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
}}

start =
 	// comment
	__ builtInTypes __

comment "comment"
	= multiLineComment
	/ singleLineComment

multiLineComment "multi line comment"
	= '/*' (!'*/' .)* '*/' {
    	return node(Kind.multiLineComment, text(), location());
    }

singleLineComment " single line comment"
	= '//' (!lineTerminator .)* {
    	return node(Kind.singleLineComment, text(), location());
    }

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
	= 'tuple' __ '<' __ list:tupleList __ '>' {
    	return node(Kind.tuple, text(), location(), { items: list });
    }

tupleList "tuple element list"
    = builtInTypes|.., __ ',' __ |
	/ builtInTypes

list "element list"
	= 'list' __ '<' __ builtInTypes __ '>'

option "option type"
	= 'option' __ '<' __ builtInTypes __ '>'

result "result type"
	= 'result' __ '<' __ builtInTypes __ ',' __ builtInTypes __ '>'
    / 'result' __ '<' __ '_' __ ',' __ builtInTypes __ '>'
    / 'result' __ '<' __ builtInTypes __ '>'
    / 'result'

handle "handle type"
	= id
    / 'borrow' __ '<' __ id __ '>'

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

lineTerminator
	= [\n\r]

lineTerminatorSequence "end of line"
	= "\n"
    / "\r"
    / "\r\n"

__ "whitespace with comments"
	= _

_ "whitespace"
	= [ \t\n\r]*