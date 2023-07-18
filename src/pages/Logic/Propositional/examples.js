const examples = [
    {
	op: "or",
	args: [
            {
		op: "not",
		args: [
                    {
			op: "not",
			args: [
                            {
				op: "or",
				args: [
                                    {
					op: "not",
					args: [
                                            {
						op: "or",
						args: [
                                                    {
							var: "x"
                                                    },
                                                    {
							var: "y"
                                                    }
						]
                                            }
					]
                                    },
                                    {
					var: "z"
                                    }
				]
                            }
			]
                    }
		]
            },
            {
		op: "not",
		args: [
                    {
			op: "or",
			args: [
                            {
				var: "x"
                            },
                            {
				op: "not",
				args: [
                                    {
					op: "or",
					args: [
                                            {
						op: "not",
						args: [
                                                    {
							var: "z"
                                                    }
						]
                                            },
                                            {
						op: "not",
						args: [
                                                    {
							op: "or",
							args: [
                                                            {
								var: "z"
                                                            },
                                                            {
								var: "u"
                                                            }
							]
                                                    }
						]
                                            }
					]
                                    }
				]
                            }
			]
                    }
		]
            }
	]
    },
    {
	op: "or",
	args: [
	    
	    {
		op: "not",
		args: [
		    {
			op: "or",
			args: [
			    {
				var: "x"
			    },
			    {
				op: "not",
				args: [
				    {
					op: "or",
					args: [
					    {
						op: "not",
						args: [
						    {
							var: "z"
						    }
						]
					    },
					    {
						op: "not",
						args: [
						    {
							op: "or",
							args: [
							    {
								var: "z"
							    },
							    {
								var: "u"
							    }
							]
						    }
						]
					    }
					]
				    }
				]
			    }
			]
		    }
		]
	    },
	    {
		op: "not",
		args: [
		    {
			op: "not",
			args: [
			    {
				op: "or",
				args: [
				    {
					op: "not",
					args: [
					    {
						op: "or",
						args: [
						    {
							var: "x"
						    },
						    {
							var: "y"
						    }
						]
					    }
					]
				    },
				    {
					var: "z"
				    }
				]
			    }
			]
		    }
		]
	    },
	]
    }
];

export {examples};
