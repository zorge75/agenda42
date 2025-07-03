import React, { cloneElement, FC, HTMLAttributes, ReactElement, ReactNode, useCallback, useEffect, useState } from 'react';
import { usePopper } from 'react-popper';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import Portal from '../../layout/Portal/Portal';

type Direction =
	| 'auto'
	| 'auto-start'
	| 'auto-end'
	| 'top'
	| 'top-start'
	| 'top-end'
	| 'bottom'
	| 'bottom-start'
	| 'bottom-end'
	| 'right'
	| 'right-start'
	| 'right-end'
	| 'left'
	| 'left-start'
	| 'left-end';

interface IPopoversProps extends HTMLAttributes<HTMLDivElement> {
	children: ReactElement | string;
	className?: string;
	bodyClassName?: string | null;
	title?: string;
	desc?: ReactNode;
	placement?: Direction;
	flip?: Direction[];
	trigger?: 'click' | 'hover';
	delay?: number;
	isDisplayInline?: boolean;
	modifiers?: object;
}

const Popovers: FC<IPopoversProps> = ({
	children,
	className,
	bodyClassName,
	title,
	desc,
	placement,
	flip,
	trigger,
	delay,
	isDisplayInline,
	modifiers,
	...props
}) => {
	const [referenceElement, setReferenceElement] = useState<HTMLSpanElement | null>(null);
	const [popperElement, setPopperElement] = useState<HTMLDivElement | null>(null);
	const [arrowElement, setArrowElement] = useState<HTMLDivElement | null>(null);
	const { styles, attributes } = usePopper(referenceElement, popperElement, {
		placement,
		modifiers: [
			{
				name: 'offset',
				options: {
					offset: [0, 6.5],
				},
			},
			{
				name: 'flip',
				enabled: true,
				options: {
					fallbackPlacements: flip,
				},
			},
			{
				name: 'arrow',
				options: {
					element: arrowElement,
				},
			},
			{ ...modifiers },
		],
	});

	const [popoverOpen, setPopoverOpen] = useState(false);

	const closeMenu = useCallback(() => {
		setPopoverOpen(false);
	}, []);

	// Handle outside click detection
	useEffect(() => {
		if (trigger !== 'click' || !popoverOpen) return;

		const handleClickOutside = (event: MouseEvent) => {
			const target = event.target as Node;
			const isOutside =
				referenceElement &&
				popperElement &&
				!referenceElement.contains(target) &&
				!popperElement.contains(target);

			if (isOutside) {
				closeMenu();
			}
		};

		document.addEventListener('click', handleClickOutside);
		return () => {
			document.removeEventListener('click', handleClickOutside);
		};
	}, [trigger, popoverOpen, referenceElement, popperElement, closeMenu]);

	const ON_CLICK = useCallback(() => {
		if (trigger === 'click') {
			setPopoverOpen((prev) => !prev);
		}
		if (typeof children !== 'string' && children?.props?.onClick) {
			children.props.onClick();
		}
	}, [trigger, children]);

	const ON_MOUSE_OVER = useCallback(() => {
		if (trigger === 'hover') {
			setPopoverOpen(true);
		}
		if (typeof children !== 'string' && children?.props?.onMouseOver) {
			children.props.onMouseOver();
		}
	}, [trigger, children]);

	const ON_MOUSE_LEAVE = useCallback(() => {
		if (trigger === 'hover') {
			setTimeout(() => setPopoverOpen(false), delay);
		}
		if (typeof children !== 'string' && children?.props?.onMouseLeave) {
			children.props.onMouseLeave();
		}
	}, [trigger, delay, children]);

	const PROPS = {
		className: classNames(
			{ 'd-inline-block': isDisplayInline, 'popover-string': typeof children === 'string' },
			typeof children !== 'string' && children?.props?.className,
		),
		onClick: ON_CLICK,
		onMouseOver: ON_MOUSE_OVER,
		onMouseLeave: ON_MOUSE_LEAVE,
	};

	return (
		<div>
			{cloneElement(
				typeof children === 'string' ? (
					<span ref={setReferenceElement} {...PROPS}>
						{children}
					</span>
				) : (
					children
				),
				{
					ref: setReferenceElement,
					...PROPS,
				},
			)}
			{popoverOpen && (
				<Portal>
					<div
						ref={setPopperElement}
						role="tooltip"
						className={classNames('popover', 'bs-popover-auto', className)}
						style={styles.popper}
						{...props}
						{...attributes.popper}
					>
						<div ref={setArrowElement} className="popover-arrow" style={styles.arrow} />
						{title && <h3 className="popover-header">{title}</h3>}
						{desc && <div className={classNames('popover-body', bodyClassName)}>{desc}</div>}
					</div>
				</Portal>
			)}
		</div>
	);
};

Popovers.propTypes = {
	children: PropTypes.node.isRequired,
	title: PropTypes.string,
	desc: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
	placement: PropTypes.oneOf([
		'auto',
		'auto-start',
		'auto-end',
		'top',
		'top-start',
		'top-end',
		'bottom',
		'bottom-start',
		'bottom-end',
		'right',
		'right-start',
		'right-end',
		'left',
		'left-start',
		'left-end',
	]),
	flip: PropTypes.arrayOf(
		PropTypes.oneOf([
			'auto',
			'auto-start',
			'auto-end',
			'top',
			'top-start',
			'top-end',
			'bottom',
			'bottom-start',
			'bottom-end',
			'right',
			'right-start',
			'right-end',
			'left',
			'left-start',
			'left-end',
		]),
	),
	trigger: PropTypes.oneOf(['click', 'hover']),
	delay: PropTypes.number,
	isDisplayInline: PropTypes.bool,
	className: PropTypes.string,
	bodyClassName: PropTypes.string,
	modifiers: PropTypes.object,
};

Popovers.defaultProps = {
	title: undefined,
	desc: null,
	placement: 'top',
	flip: ['top', 'bottom'],
	trigger: 'click',
	delay: 0,
	isDisplayInline: false,
	className: undefined,
	bodyClassName: null,
	modifiers: {
		name: 'example',
		enabled: false,
		phase: 'read',
		fn: () => { },
	},
};

export default Popovers;